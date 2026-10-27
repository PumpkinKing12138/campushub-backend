import { useState } from 'react'
import type { ReactElement } from 'react'
import type { Resource } from './api/campushubApi'
import BookingForm from './components/BookingForm'
import ResourceList from './components/ResourceList'
import UserReservations from './components/UserReservations'

const CURRENT_USER_ID = 'user-456'

export default function App(): ReactElement {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [bookingsVersion, setBookingsVersion] = useState<number>(0)

  function handleBookingCreated(): void {
    setBookingsVersion((version: number): number => version + 1)
  }

  return (
    <main>
      <header>
        <h1>CampusHub</h1>
        <p>Find and reserve campus resources.</p>
        <p>Demo Student ID: {CURRENT_USER_ID}</p>
      </header>

      <ResourceList onSelectResource={setSelectedResource} />

      {selectedResource && (
        <BookingForm
          key={selectedResource.id}
          resource={selectedResource}
          userId={CURRENT_USER_ID}
          onBookingCreated={handleBookingCreated}
        />
      )}

      <UserReservations
        key={bookingsVersion}
        userId={CURRENT_USER_ID}
      />
    </main>
  )
}
