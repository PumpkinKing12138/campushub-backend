export type ResourceType = 'ROOM' | 'EQUIPMENT' | 'LAB'

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

export interface Resource {
  id: string
  name: string
  type: ResourceType
  location: string
  isAvailable: boolean
}

export interface CreateReservationDTO {
  resourceId: string
  userId: string
  startTime: string
  endTime: string
}

export interface Reservation extends CreateReservationDTO {
  id: string
  status: ReservationStatus
}

export interface ErrorResponse {
  code: string
  message: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

const API_BASE_URL = '/api/v1'

function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    typeof value.code === 'string' &&
    'message' in value &&
    typeof value.message === 'string'
  )
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: AbortSignal.timeout(15000),
    })
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError(
        0,
        'REQUEST_TIMEOUT',
        'The request timed out. Please try again.',
      )
    }

    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Unable to connect to the server. Please try again.',
    )
  }

  const body: unknown = await response.json().catch((): null => null)

  if (!response.ok) {
    if (isErrorResponse(body)) {
      throw new ApiError(response.status, body.code, body.message)
    }

    throw new ApiError(
      response.status,
      'HTTP_ERROR',
      `The request failed with status ${response.status}.`,
    )
  }

  if (body === null) {
    throw new ApiError(
      response.status,
      'INVALID_RESPONSE',
      'The server returned an invalid response.',
    )
  }

  return body as T
}

export function fetchResources(
  type?: ResourceType,
): Promise<Resource[]> {
  const query = type ? `?type=${encodeURIComponent(type)}` : ''
  return request<Resource[]>(`/resources${query}`)
}

export function createReservation(
  payload: CreateReservationDTO,
): Promise<Reservation> {
  return request<Reservation>('/reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

export function fetchUserReservations(
  userId: string,
): Promise<Reservation[]> {
  return request<Reservation[]>(
    `/reservations/user/${encodeURIComponent(userId)}`,
  )
}

export function cancelReservation(
  reservationId: string,
): Promise<Reservation> {
  return request<Reservation>(
    `/reservations/${encodeURIComponent(reservationId)}/cancel`,
    {
      method: 'PATCH',
    },
  )
}
