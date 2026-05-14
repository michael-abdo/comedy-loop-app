import { useState, useEffect, useRef } from 'react'
import './App.css'

export default function App() {
  const playerRef = useRef(null)
  const [videoId, setVideoId] = useState('')
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(10)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [playerReady, setPlayerReady] = useState(false)
  const [setMode, setSetMode] = useState('start')

  useEffect(() => {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '450',
        width: '100%',
        videoId: videoId || 'tRuY2fTTRi8',
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      })
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (videoId && playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(videoId)
    }
  }, [videoId])

  useEffect(() => {
    if (playerReady && playerRef.current) {
      try {
        const availableRates = playerRef.current.getAvailablePlaybackRates()
        if (availableRates.includes(speed)) {
          playerRef.current.setPlaybackRate(speed)
        }
      } catch (e) {
        console.log('Speed control not available')
      }
    }
  }, [speed, playerReady])

  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const current = playerRef.current.getCurrentTime()
        setCurrentTime(current)

        if (isPlaying && current >= endTime) {
          playerRef.current.seekTo(startTime)
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, startTime, endTime])

  const onPlayerReady = (event) => {
    setDuration(event.target.getDuration())
    setPlayerReady(true)
    event.target.setPlaybackRate(speed)
  }

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
    }
  }

  const handlePlay = () => {
    playerRef.current.playVideo()
  }

  const handlePause = () => {
    playerRef.current.pauseVideo()
  }

  const handleLoadVideo = (e) => {
    const url = e.target.value
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    if (match) {
      setVideoId(match[1])
      setStartTime(0)
      setEndTime(10)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const adjustStartTime = (delta) => {
    let newStart = startTime + delta
    newStart = Math.max(0, Math.min(newStart, endTime - 0.1))
    newStart = parseFloat(newStart.toFixed(1))
    setStartTime(newStart)
    if (playerRef.current) {
      playerRef.current.seekTo(newStart)
    }
  }

  const adjustEndTime = (delta) => {
    let newEnd = endTime + delta
    newEnd = Math.max(startTime + 0.1, Math.min(newEnd, duration))
    newEnd = parseFloat(newEnd.toFixed(1))
    setEndTime(newEnd)
    if (playerRef.current) {
      playerRef.current.seekTo(newEnd)
    }
  }

  const setToCurrentTime = () => {
    const rounded = parseFloat(currentTime.toFixed(1))
    if (setMode === 'start') {
      if (rounded < endTime - 0.1) {
        setStartTime(rounded)
      }
    } else {
      if (rounded > startTime + 0.1) {
        setEndTime(rounded)
      }
    }
  }

  return (
    <div className="app">
      <h1>Comedy Loop Practice</h1>

      <div className="input-section">
        <input
          type="text"
          placeholder="Paste YouTube URL..."
          onBlur={handleLoadVideo}
          className="url-input"
        />
      </div>

      <div id="youtube-player"></div>

      <div className="controls-section">
        <div className="buttons">
          <button onClick={handlePlay} className="btn btn-play">
            ▶ Play
          </button>
          <button onClick={handlePause} className="btn btn-pause">
            ⏸ Pause
          </button>
        </div>

        <div className="speed-control">
          <label>Speed:</label>
          <select value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}>
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>

        <div className="set-time-control">
          <button
            className={`toggle-btn ${setMode === 'start' ? 'active' : ''}`}
            onClick={() => setSetMode('start')}
          >
            SET START
          </button>
          <button
            className={`toggle-btn ${setMode === 'end' ? 'active' : ''}`}
            onClick={() => setSetMode('end')}
          >
            SET END
          </button>
          <button onClick={setToCurrentTime} className="btn btn-set">
            ⏱ Set to Current Time
          </button>
        </div>
      </div>

      <div className="timeline-section">
        <div className="time-display">
          Current: {formatTime(currentTime)} | Loop: {formatTime(startTime)} - {formatTime(endTime)}
        </div>

        <div className="slider-container">
          <label>Start (seconds):</label>
          <button className="adj-btn" onClick={() => adjustStartTime(-0.5)}>−</button>
          <input
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={startTime}
            onChange={(e) => setStartTime(parseFloat(e.target.value))}
            className="slider"
          />
          <button className="adj-btn" onClick={() => adjustStartTime(0.5)}>+</button>
          <span>{formatTime(startTime)}</span>
        </div>

        <div className="slider-container">
          <label>End (seconds):</label>
          <button className="adj-btn" onClick={() => adjustEndTime(-0.5)}>−</button>
          <input
            type="range"
            min={startTime}
            max={duration}
            step="0.1"
            value={endTime}
            onChange={(e) => setEndTime(parseFloat(e.target.value))}
            className="slider"
          />
          <button className="adj-btn" onClick={() => adjustEndTime(0.5)}>+</button>
          <span>{formatTime(endTime)}</span>
        </div>

        <div className="info">
          Duration: {formatTime(duration)} | Loop length: {formatTime(endTime - startTime)}s
        </div>
      </div>
    </div>
  )
}
