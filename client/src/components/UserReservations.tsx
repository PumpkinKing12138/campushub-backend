import type { ReactElement } from 'react'
import type { Reservation } from '../api/campushubApi'
import type { ReservationListState } from '../hooks/useReservations'
import styles from './UserReservations.module.css'

interface UserReservationsProps extends ReservationListState {
  userId: string
}

export default function UserReservations({
  userId, reservations, isLoading, cancellingId, error, success, refresh, handleCancel,
}: UserReservationsProps): ReactElement {
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
