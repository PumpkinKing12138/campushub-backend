import { useCallback, useEffect, useRef, useState } from 'react'
import {
  cancelReservation, createReservation, fetchUserReservations,
  type CreateReservationDTO, type Reservation,
} from '../api/campushubApi'

export interface ReservationListState {
  reservations: Reservation[]
  isLoading: boolean
  cancellingId: string | null
  error: string | null
  success: string | null
  refresh: () => void
  handleCancel: (id: string) => Promise<void>
}

interface ReservationWorkflow {
  list: ReservationListState
  isSubmitting: boolean
  book: (input: CreateReservationDTO) => Promise<boolean>
}

export function useReservations(userId: string): ReservationWorkflow {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const requestVersion = useRef(0)
  const submitting = useRef(false)
  const cancelling = useRef(false)

  const load = useCallback(async (warning?: string): Promise<void> => {
    const version = ++requestVersion.current
    await fetchUserReservations(userId)
      .then((latest: Reservation[]): void => {
        if (version === requestVersion.current) setReservations(latest)
      })
      .catch((cause: unknown): void => {
        if (version === requestVersion.current) {
          setError(warning ?? (cause instanceof Error ? cause.message : 'Unable to load reservations.'))
        }
      })
      .finally((): void => {
        if (version === requestVersion.current) setIsLoading(false)
      })
  }, [userId])

  useEffect(() => {
    void load()
    return (): void => { requestVersion.current += 1 }
  }, [load])

  function refresh(): void {
    setError(null)
    setSuccess(null)
    setIsLoading(true)
    void load()
  }

  async function book(input: CreateReservationDTO): Promise<boolean> {
    if (submitting.current) return false
    submitting.current = true
    setIsSubmitting(true)
    try {
      await createReservation(input)
      refresh()
      return true
    } finally {
      submitting.current = false
      setIsSubmitting(false)
    }
  }

  async function handleCancel(id: string): Promise<void> {
    if (cancelling.current) return
    cancelling.current = true
    setCancellingId(id)
    setError(null)
    setSuccess(null)
    try {
      const updated = await cancelReservation(id)
      setReservations(current => current.map(item => item.id === updated.id ? updated : item))
      setSuccess('Reservation cancelled successfully.')
      await load('The reservation was cancelled, but the list could not be refreshed. Please refresh the list.')
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to cancel the reservation.')
    } finally {
      cancelling.current = false
      setCancellingId(null)
    }
  }

  return {
    book, isSubmitting,
    list: { reservations, isLoading, cancellingId, error, success, refresh, handleCancel },
  }
}
