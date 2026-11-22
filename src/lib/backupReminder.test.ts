import { describe, expect, it } from 'vitest'
import { BACKUP_DUE_DAYS, backupDue, lastAdded } from './backupReminder'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 10, 22, 12)

describe('backup reminder', () => {
  it('finds the newest thing added across pieces, looks and wears', () => {
    expect(lastAdded([], [])).toBeNull()
    expect(lastAdded([{ createdAt: 5 }], [{ createdAt: 9 }, { createdAt: 2 }])).toBe(9)
  })

  it('never nags about an empty closet', () => {
    expect(backupDue(null, null, NOW)).toBe(false)
  })

  it('asks for a first backup once there is something to save', () => {
    expect(backupDue(null, NOW - DAY, NOW)).toBe(true)
  })

  it('waits two weeks after a backup before asking again', () => {
    const backup = NOW - (BACKUP_DUE_DAYS - 1) * DAY
    expect(backupDue(backup, NOW, NOW)).toBe(false)
    expect(backupDue(NOW - BACKUP_DUE_DAYS * DAY, NOW, NOW)).toBe(true)
  })

  it('never asks when nothing was added since the last backup', () => {
    const backup = NOW - 90 * DAY
    expect(backupDue(backup, backup - DAY, NOW)).toBe(false)
  })
})
