import { useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import {
  ApiError,
  type CreateReservationDTO,
  type Resource,
} from '../api/campushubApi'
import styles from './BookingForm.module.css'

interface BookingFormProps {
  resource: Resource
  userId: string
  book: (input: CreateReservationDTO) => Promise<boolean>
  isSubmitting: boolean
}

export default function BookingForm({
  resource,
  userId,
  book,
  isSubmitting,
}: BookingFormProps): ReactElement {
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setError(null)
    setSuccess(null)

    if (!userId.trim() || !startTime || !endTime) {
      setError('Please provide a user ID, start time, and end time.')
      return
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      setError('End time must be later than start time.')
      return
    }

    try {
      const created = await book({
        resourceId: resource.id,
        userId: userId.trim(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      })

      if (created) setSuccess('Reservation created successfully.')
    } catch (cause: unknown) {
      if (cause instanceof ApiError && cause.status === 409) {
        setError(
          'This resource is already reserved for the selected time window.',
        )
      } else {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Unable to create the reservation.',
        )
      }
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="booking-heading">
      <h2 id="booking-heading">Book {resource.name}</h2>
      <p>Booking as: {userId}</p>
      <p>Enter times in your local time zone.</p>

      <form
        onSubmit={handleSubmit}
        aria-busy={isSubmitting}
      >
        <fieldset className={styles.fields} disabled={isSubmitting}>
          <legend>Reservation Times</legend>

          <label htmlFor="start-time">Start Time</label>
          <input
            id="start-time"
            type="datetime-local"
            required
            value={startTime}
            onChange={(event): void => setStartTime(event.target.value)}
          />

          <label htmlFor="end-time">End Time</label>
          <input
            id="end-time"
            type="datetime-local"
            required
            value={endTime}
            onChange={(event): void => setEndTime(event.target.value)}
          />

          <button type="submit">
            {isSubmitting ? 'Booking...' : 'Create Reservation'}
          </button>
        </fieldset>

        {isSubmitting && <p role="status">Submitting reservation...</p>}

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
      </form>
    </section>
  )
}
