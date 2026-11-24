Feature: Campus resource reservations

  Scenario: A student successfully reserves an available study room
    Given a student is on the CampusHub home page
    And "Study Room 302" is available tomorrow from 10:00 AM to 11:00 AM
    When the student filters resources by "ROOM"
    And selects "Book Resource" for "Study Room 302"
    And submits a reservation for that time
    Then the student should see a reservation confirmation
    And "My Bookings" should show the new reservation with the selected room's resource ID and the requested start and end times

  Scenario: A student attempts to reserve an already-booked resource
    Given another student has reserved "3D Printer A" tomorrow from 2:00 PM to 3:00 PM
    When the student attempts to reserve "3D Printer A" for the same time
    Then the student should see a booking conflict message
    And no new reservation should appear in the student's "My Bookings" list