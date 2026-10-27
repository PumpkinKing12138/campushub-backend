import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import {
  cancelReservation,
  fetchUserReservations,
  type Reservation,
} from '../api/campushubApi'
import styles from './UserReservations.module.css'

interface UserReservationsProps {
  userId: string
}

export default function UserReservations({
  userId,
}: UserReservationsProps): ReactElement {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [refreshCount, setRefreshCount] = useState<number>(0)
  const cancellingRef = useRef<boolean>(false)

  useEffect(() => {
    let active = true

    fetchUserReservations(userId)
      .then((data: Reservation[]): void => {
        if (active) {
          setReservations(data)
        }
      })
      .catch((cause: unknown): void => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Unable to load reservations.',
          )
        }
      })
      .finally((): void => {
        if (active) {
          setIsLoading(false)
        }
      })

    return (): void => {
      active = false
    }
  }, [userId, refreshCount])

  function refresh(): void {
    setError(null)
    setSuccess(null)
    setIsLoading(true)
    setRefreshCount((count: number): number => count + 1)
  }

  async function handleCancel(reservationId: string): Promise<void> {
    if (cancellingRef.current) {
      return
    }

    cancellingRef.current = true
    setCancellingId(reservationId)
    setError(null)
    setSuccess(null)

    try {
      const updated = await cancelReservation(reservationId)

      setReservations((current: Reservation[]): Reservation[] =>
        current.map((reservation: Reservation): Reservation =>
          reservation.id === updated.id ? updated : reservation,
        ),
      )
      setSuccess('Reservation cancelled successfully.')

      try {
        const latest = await fetchUserReservations(userId)
        setReservations(latest)
      } catch {
        setError(
          'The reservation was cancelled, but the list could not be refreshed. Please refresh the list.',
        )
      }
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to cancel the reservation.',
      )
    } finally {
      cancellingRef.current = false
      setCancellingId(null)
    }
  }

  const activeReservations = reservations.filter(
    (reservation: Reservation): boolean =>
      reservation.status !== 'CANCELLED',
  )

  return (
    <section className={styles.panel} aria-labelledby="my-bookings-heading">
      <h2 id="my-bookings-heading">My Bookings</h2>
      <p>Active reservations for {userId}. Times are shown in your local time zone.</p>

      <button
        type="button"
        onClick={refresh}
        disabled={isLoading || cancellingId !== null}
      >
        Refresh Bookings
      </button>

      {isLoading && <p role="status">Loading reservations...</p>}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className={styles.success} role="status">
          {success}
        </p>
      )}

      {!isLoading && !error && activeReservations.length === 0 && (
        <p>You have no active reservations.</p>
      )}

      {!isLoading && (
        <ul className={styles.list}>
          {activeReservations.map(
            (reservation: Reservation): ReactElement => (
              <li key={reservation.id} className={styles.booking}>
                <h3>Reservation</h3>
                <p>Reservation ID: {reservation.id}</p>
                <p>Resource ID: {reservation.resourceId}</p>
                <p>
                  Start: {new Date(reservation.startTime).toLocaleString()}
                </p>
                <p>
                  End: {new Date(reservation.endTime).toLocaleString()}
                </p>
                <p>Status: {reservation.status}</p>

                <button
                  type="button"
                  disabled={cancellingId !== null}
                  onClick={(): void => {
                    void handleCancel(reservation.id)
                  }}
                  aria-label={`Cancel reservation ${reservation.id}`}
                >
                  {cancellingId === reservation.id
                    ? 'Cancelling...'
                    : 'Cancel Reservation'}
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  )
}
