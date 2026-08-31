/**
 * PasswordGate.jsx
 *
 * Fullscreen password prompt that matches the LoadingScreen aesthetic.
 * Calls onUnlocked() when the correct password is entered.
 * Remembers the session so a page refresh doesn't require re-entry.
 */

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'

const PASSWORD = '2026'
const SESSION_KEY = 'kail_unlocked'

export default function PasswordGate({ onUnlocked }) {
  const [value,   setValue]   = useState('')
  const [error,   setError]   = useState(false)
  const [shake,   setShake]   = useState(false)
  const inputRef = useRef(null)

  const attempt = () => {
    if (value === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onUnlocked()
    } else {
      setError(true)
      setShake(true)
      setValue('')
      setTimeout(() => setShake(false), 600)
      inputRef.current?.focus()
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') attempt()
    if (error) setError(false)
  }

  return (
    <motion.div
      className="pg-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5 } }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
    >
      {/* ── Ambient colour blobs ─────────────────────────────────── */}
      <div className="ls-blob ls-blob--blue"  aria-hidden="true" />
      <div className="ls-blob ls-blob--lilac" aria-hidden="true" />
      <div className="ls-blob ls-blob--lime"  aria-hidden="true" />

      {/* ── Floating orbs ────────────────────────────────────────── */}
      <div className="ls-orb ls-orb--a" aria-hidden="true" />
      <div className="ls-orb ls-orb--b" aria-hidden="true" />
      <div className="ls-orb ls-orb--c" aria-hidden="true" />
      <div className="ls-orb ls-orb--d" aria-hidden="true" />

      {/* ── Frosted card ─────────────────────────────────────────── */}
      <motion.div
        className="ls-card pg-card"
        animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
      >
        {/* Logo */}
        <div className="ls-logo-group">
          <img
            src={`${import.meta.env.BASE_URL}logo.svg`}
            alt="Studio KAIL"
            className="ls-logo"
            draggable="false"
          />
          <p className="ls-byline">
            <span>by</span><span>kana</span><span>raja</span>
          </p>
        </div>

        <div className="ls-divider" aria-hidden="true" />

        <p className="pg-label">Enter password to continue</p>

        {/* Password input */}
        <input
          ref={inputRef}
          className={`pg-input${error ? ' pg-input--error' : ''}`}
          type="password"
          inputMode="numeric"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false) }}
          onKeyDown={onKeyDown}
          placeholder="••••"
          autoFocus
          aria-label="Password"
        />

        <button className="pg-btn" onClick={attempt} aria-label="Unlock">
          Enter
        </button>
      </motion.div>
    </motion.div>
  )
}
