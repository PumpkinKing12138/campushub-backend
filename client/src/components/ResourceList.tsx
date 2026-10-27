import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import {
  fetchResources,
  type Resource,
  type ResourceType,
} from '../api/campushubApi'
import styles from './ResourceList.module.css'

interface ResourceListProps {
  onSelectResource: (resource: Resource) => void
}

type ResourceFilter = ResourceType | 'ALL'

export default function ResourceList({
  onSelectResource,
}: ResourceListProps): ReactElement {
  const [filter, setFilter] = useState<ResourceFilter>('ALL')
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState<number>(0)

  useEffect(() => {
    let active = true

    fetchResources(filter === 'ALL' ? undefined : filter)
      .then((data: Resource[]): void => {
        if (active) {
          setResources(data)
        }
      })
      .catch((cause: unknown): void => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Unable to load resources.',
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
  }, [filter, retryCount])

  function changeFilter(nextFilter: ResourceFilter): void {
    if (nextFilter === filter) {
      return
    }

    setIsLoading(true)
    setError(null)
    setResources([])
    setFilter(nextFilter)
  }

  function retry(): void {
    setIsLoading(true)
    setError(null)
    setRetryCount((count: number): number => count + 1)
  }

  return (
    <section className={styles.section} aria-labelledby="resources-heading">
      <h2 id="resources-heading">Campus Resources</h2>
      <p>Browse campus spaces and equipment, then select a resource to book.</p>

      <div className={styles.filters} aria-label="Filter by resource type">
        {(['ALL', 'ROOM', 'EQUIPMENT', 'LAB'] as const).map(
          (type: ResourceFilter): ReactElement => (
            <button
              key={type}
              type="button"
              aria-pressed={filter === type}
              onClick={(): void => changeFilter(type)}
            >
              {type === 'ALL' ? 'All Resources' : type}
            </button>
          ),
        )}
      </div>

      {isLoading && <p role="status">Loading resources...</p>}

      {error && (
        <div className={styles.error} role="alert">
          <p>{error}</p>
          <button type="button" onClick={retry}>
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && resources.length === 0 && (
        <p>No resources found for this filter.</p>
      )}

      {!isLoading && !error && (
        <div className={styles.grid}>
          {resources.map(
            (resource: Resource): ReactElement => (
              <article key={resource.id} className={styles.card}>
                <span className={styles.type}>{resource.type}</span>
                <h3>{resource.name}</h3>
                <p>{resource.location}</p>
                <p>{resource.isAvailable ? 'Available' : 'Unavailable'}</p>
                <button
                  type="button"
                  disabled={!resource.isAvailable}
                  onClick={(): void => onSelectResource(resource)}
                  aria-label={`Book ${resource.name}`}
                >
                  Book Resource
                </button>
              </article>
            ),
          )}
        </div>
      )}
    </section>
  )
}
