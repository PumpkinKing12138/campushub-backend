import { expect, test } from '@playwright/test';

test('a student successfully reserves an available study room', async ({ page }) => {
  await page.goto('/');

  const roomName = 'Study Room 302';
  await page.getByRole('button', { name: 'ROOM', exact: true }).click();
  await expect(page.getByText(roomName, { exact: true })).toBeVisible();
  await expect(page.getByText('3D Printer A', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: `Book ${roomName}`, exact: true }).click();

  const form = page.getByRole('region', { name: `Book ${roomName}`, exact: true });
  await expect(form.getByLabel('Start Time')).toBeVisible();
  await expect(form.getByLabel('End Time')).toBeVisible();
    const slot = await page.evaluate(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    const start = `${date}T10:00`;
    const end = `${date}T11:00`;

    return {
      start,
      end,
      startText: new Date(start).toLocaleString(),
      endText: new Date(end).toLocaleString(),
    };
  });

  const resourcesResponse = await page.request.get('/api/v1/resources?type=ROOM');
  await expect(resourcesResponse).toBeOK();
  const rooms: { id: string; name: string }[] = await resourcesResponse.json();
  const room = rooms.find(resource => resource.name === roomName);
  if (!room) throw new Error(`Room not found: ${roomName}`);

  await form.getByLabel('Start Time').fill(slot.start);
  await form.getByLabel('End Time').fill(slot.end);

  const [response] = await Promise.all([
    page.waitForResponse(res =>
      new URL(res.url()).pathname === '/api/v1/reservations' &&
      res.request().method() === 'POST'
    ),
    form.getByRole('button', { name: 'Create Reservation' }).click(),
  ]);

  expect(response.ok(), `Booking returned HTTP ${response.status()}`).toBe(true);
  const reservation: { id: string } = await response.json();

  try {
    await expect(form.getByRole('status')).toHaveText(
      'Reservation created successfully.'
    );

    const bookings = page.getByRole('region', { name: 'My Bookings' });
    const entry = bookings.getByRole('listitem').filter({
      has: page.getByText(`Reservation ID: ${reservation.id}`, { exact: true }),
    });

    await expect(entry.getByText(`Resource ID: ${room.id}`, { exact: true })).toBeVisible();
    await expect(entry.getByText(`Start: ${slot.startText}`, { exact: true })).toBeVisible();
    await expect(entry.getByText(`End: ${slot.endText}`, { exact: true })).toBeVisible();
  } finally {
    const cleanup = await page.request.patch(
      `/api/v1/reservations/${reservation.id}/cancel`
    );
    await expect(cleanup).toBeOK();
  }
});

test('a student cannot reserve an already-booked resource', async ({ page }) => {
  await page.goto('/');

  const printerName = '3D Printer A';
  const resources = await page.request.get('/api/v1/resources?type=EQUIPMENT');
  await expect(resources).toBeOK();

  const equipment: { id: string; name: string }[] = await resources.json();
  const printer = equipment.find(item => item.name === printerName);
  if (!printer) throw new Error(`Equipment not found: ${printerName}`);

  const slot = await page.evaluate(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const start = `${year}-${month}-${day}T14:00`;
    const end = `${year}-${month}-${day}T15:00`;

    return {
      start,
      end,
      startISO: new Date(start).toISOString(),
      endISO: new Date(end).toISOString(),
      startText: new Date(start).toLocaleString(),
    };
  });

  // Reserve the printer as a different student before the UI attempt.
  const setup = await page.request.post('/api/v1/reservations', {
    data: {
      resourceId: printer.id,
      userId: 'user-123',
      startTime: slot.startISO,
      endTime: slot.endISO,
    },
  });
  await expect(setup).toBeOK();
  const existing: { id: string } = await setup.json();
  const createdIds = [existing.id];

  try {
    await page.getByRole('button', { name: 'EQUIPMENT', exact: true }).click();
    await page.getByRole('button', { name: `Book ${printerName}`, exact: true }).click();

    const form = page.getByRole('region', { name: `Book ${printerName}`, exact: true });
    await form.getByLabel('Start Time').fill(slot.start);
    await form.getByLabel('End Time').fill(slot.end);

    const [response] = await Promise.all([
      page.waitForResponse(res =>
        new URL(res.url()).pathname === '/api/v1/reservations' &&
        res.request().method() === 'POST'
      ),
      form.getByRole('button', { name: 'Create Reservation' }).click(),
    ]);

    if (response.ok()) {
      const duplicate: { id: string } = await response.json();
      createdIds.push(duplicate.id);
    }

    expect(response.status()).toBe(409);
    await expect(form.getByRole('alert')).toHaveText(
      'This resource is already reserved for the selected time window.'
    );

    const bookings = page.getByRole('region', { name: 'My Bookings' });
    const [refresh] = await Promise.all([
      page.waitForResponse(res =>
        new URL(res.url()).pathname === '/api/v1/reservations/user/user-456' &&
        res.request().method() === 'GET'
      ),
      bookings.getByRole('button', { name: 'Refresh Bookings' }).click(),
    ]);
    expect([200, 304], 'Refresh Bookings HTTP status').toContain(refresh.status());
    await expect(bookings.getByRole('list')).toBeVisible();

    const duplicateEntry = bookings.getByRole('listitem')
      .filter({ has: page.getByText(`Resource ID: ${printer.id}`, { exact: true }) })
      .filter({ has: page.getByText(`Start: ${slot.startText}`, { exact: true }) });
    await expect(duplicateEntry).toHaveCount(0);
  } finally {
    for (const id of createdIds) {
      const cleanup = await page.request.patch(`/api/v1/reservations/${id}/cancel`);
      await expect(cleanup).toBeOK();
    }
  }
});