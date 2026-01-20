import { supabase, session } from './auth-check.js'

// =====================================
// Auth Check Complete
// =====================================
// Authentication has been verified by auth-check.js
// Session is guaranteed to exist at this point

// =====================================
// State Management
// =====================================
const state = {
  user: null,
  categories: [],
  sessions: [],
  settings: {
    autoStartBreak: false,
    soundEnabled: true,
    breakDuration: 5
  },
  timer: {
    duration: 25 * 60, // 25 minutes in seconds
    remaining: 25 * 60,
    isRunning: false,
    isPaused: false,
    startTime: null,
    category: 'Study',
    intervalId: null
  },
  currentTab: 'timer',
  analysisRange: 'daily'
}

// Default categories
const DEFAULT_CATEGORIES = [
  { name: 'Study', icon: '📚', color: '#268bd2' },
  { name: 'Coding', icon: '💻', color: '#2aa198' },
  { name: 'Rest', icon: '🌸', color: '#d33682' }
]

// =====================================
// Utility Functions
// =====================================
const $ = (sel) => document.querySelector(sel)
const $$ = (sel) => Array.from(document.querySelectorAll(sel))

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

function getTodayString() {
  return new Date().toISOString().split('T')[0]
}

function getDateRange(range) {
  const now = new Date()
  const start = new Date()
  
  if (range === 'daily') {
    start.setHours(0, 0, 0, 0)
  } else if (range === 'weekly') {
    start.setDate(start.getDate() - 7)
  } else if (range === 'monthly') {
    start.setMonth(start.getMonth() - 1)
  }
  
  return { start: start.toISOString(), end: now.toISOString() }
}

// =====================================
// Theme Management
// =====================================
if (localStorage.getItem("pref-theme") === "dark") {
  document.body.classList.add('dark');
} else if (localStorage.getItem("pref-theme") === "light") {
  document.body.classList.remove('dark');
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.body.classList.add('dark');
}

const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  if (document.body.classList.contains('dark')) {
    localStorage.setItem('pref-theme', 'dark');
  } else {
    localStorage.setItem('pref-theme', 'light');
  }
});

// =====================================
// Sync Status Management
// =====================================
function updateSyncStatus(status) {
  const syncStatus = $('#syncStatus')
  syncStatus.className = 'sync-status'
  
  if (status === 'synced') {
    syncStatus.classList.add('synced')
    syncStatus.innerHTML = '<span>✓</span><span>同期済み</span>'
  } else if (status === 'syncing') {
    syncStatus.classList.add('syncing')
    syncStatus.innerHTML = '<span class="loading-spinner"></span><span>同期中...</span>'
  } else if (status === 'error') {
    syncStatus.classList.add('error')
    syncStatus.innerHTML = '<span>⚠</span><span>同期エラー</span>'
  }
}

// =====================================
// Initialize App After Auth Check
// =====================================
// We've already checked authentication at the top of the file
// Now initialize the app with the session we know exists
state.user = session.user
$('#userEmail').textContent = session.user.email

// Load data
await loadCategories()
await loadSessions()
await loadSettings()

// Render UI
render()
updateSyncStatus('synced')

// Listen for sign-out events
supabase.auth.onAuthStateChange((event, newSession) => {
  if (event === 'SIGNED_OUT') {
    window.location.replace('index.html')
  }
})

$('#logoutBtn').onclick = async () => {
  if (confirm('ログアウトしますか？')) {
    await supabase.auth.signOut()
    // Navigation will be handled by onAuthStateChange
  }
}

// =====================================
// Data Management
// =====================================
async function loadCategories() {
  try {
    updateSyncStatus('syncing')
    const { data, error } = await supabase
      .from('focus_categories')
      .select('*')
      .eq('user_id', state.user.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    if (!data || data.length === 0) {
      // Initialize with default categories
      for (const cat of DEFAULT_CATEGORIES) {
        try {
          await saveCategory({ ...cat, id: uid() })
        } catch (catError) {
          // Ignore duplicate errors - category may already exist
          if (!catError.message?.includes('duplicate key')) {
            console.error('Error creating default category:', catError)
          }
        }
      }
      await loadCategories()
      return
    }

    state.categories = data
    updateSyncStatus('synced')
  } catch (error) {
    console.error('Error loading categories:', error)
    updateSyncStatus('error')
  }
}

async function saveCategory(category) {
  try {
    updateSyncStatus('syncing')
    const categoryData = {
      ...category,
      user_id: state.user.id
    }

    // Use upsert with onConflict to handle duplicates
    const { error } = await supabase
      .from('focus_categories')
      .upsert(categoryData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })

    if (error) throw error

    await loadCategories()
    updateSyncStatus('synced')
  } catch (error) {
    console.error('Error saving category:', error)
    updateSyncStatus('error')
    throw error
  }
}

async function deleteCategory(id) {
  try {
    updateSyncStatus('syncing')
    const { error } = await supabase
      .from('focus_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', state.user.id)

    if (error) throw error

    await loadCategories()
    updateSyncStatus('synced')
  } catch (error) {
    console.error('Error deleting category:', error)
    updateSyncStatus('error')
    throw error
  }
}

async function loadSessions() {
  try {
    updateSyncStatus('syncing')
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', state.user.id)
      .order('start_time', { ascending: false })

    if (error) throw error

    state.sessions = data || []
    updateSyncStatus('synced')
  } catch (error) {
    console.error('Error loading sessions:', error)
    updateSyncStatus('error')
  }
}

async function saveSession(session) {
  try {
    updateSyncStatus('syncing')
    const sessionData = {
      ...session,
      user_id: state.user.id
    }

    const { error } = await supabase
      .from('focus_sessions')
      .insert(sessionData)

    if (error) throw error

    await loadSessions()
    updateSyncStatus('synced')
  } catch (error) {
    console.error('Error saving session:', error)
    updateSyncStatus('error')
    throw error
  }
}

async function loadSettings() {
  try {
    const { data, error } = await supabase
      .from('focus_settings')
      .select('*')
      .eq('user_id', state.user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (data) {
      state.settings = data.settings
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

async function saveSettings() {
  try {
    const { error } = await supabase
      .from('focus_settings')
      .upsert({
        user_id: state.user.id,
        settings: state.settings
      })

    if (error) throw error
  } catch (error) {
    console.error('Error saving settings:', error)
    throw error
  }
}

async function clearAllData() {
  try {
    updateSyncStatus('syncing')
    
    await supabase.from('focus_sessions').delete().eq('user_id', state.user.id)
    await supabase.from('focus_categories').delete().eq('user_id', state.user.id)
    await supabase.from('focus_settings').delete().eq('user_id', state.user.id)

    await loadCategories()
    await loadSessions()
    await loadSettings()
    
    updateSyncStatus('synced')
  } catch (error) {
    console.error('Error clearing data:', error)
    updateSyncStatus('error')
    throw error
  }
}

// =====================================
// Tab Navigation
// =====================================
$$('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    const tab = btn.dataset.tab
    state.currentTab = tab
    
    $$('.tab-btn').forEach(b => b.classList.remove('active'))
    $$('.tab-content').forEach(c => c.classList.remove('active'))
    
    btn.classList.add('active')
    $(`#${tab}-tab`).classList.add('active')
    
    if (tab === 'analysis') {
      renderAnalysis()
    } else if (tab === 'settings') {
      renderSettings()
    }
  }
})

// =====================================
// Timer Functions
// =====================================
function startTimer() {
  if (state.timer.isRunning) return
  
  state.timer.isRunning = true
  state.timer.isPaused = false
  state.timer.startTime = Date.now()
  
  $('#startBtn').style.display = 'none'
  $('#pauseBtn').style.display = 'flex'
  
  state.timer.intervalId = setInterval(updateTimer, 1000)
  updateTimerDisplay()
}

function pauseTimer() {
  if (!state.timer.isRunning) return
  
  state.timer.isRunning = false
  state.timer.isPaused = true
  
  $('#startBtn').style.display = 'flex'
  $('#pauseBtn').style.display = 'none'
  
  clearInterval(state.timer.intervalId)
}

function resetTimer() {
  pauseTimer()
  
  state.timer.remaining = state.timer.duration
  state.timer.isPaused = false
  state.timer.startTime = null
  
  updateTimerDisplay()
}

function updateTimer() {
  if (!state.timer.isRunning) return
  
  state.timer.remaining--
  
  if (state.timer.remaining <= 0) {
    completeSession()
  }
  
  updateTimerDisplay()
}

function updateTimerDisplay() {
  const { remaining, duration } = state.timer
  
  // Update time text
  $('#timeDisplay').textContent = formatTime(remaining)
  
  // Update circular progress
  const progress = (duration - remaining) / duration
  const circumference = 2 * Math.PI * 130 // radius = 130
  const offset = circumference - (progress * circumference)
  $('#progressCircle').style.strokeDashoffset = offset
}

async function completeSession() {
  pauseTimer()
  
  if (state.settings.soundEnabled) {
    playCompletionSound()
  }
  
  // Save session
  const sessionMinutes = Math.floor(state.timer.duration / 60)
  const session = {
    id: uid(),
    category: state.timer.category,
    duration_minutes: sessionMinutes,
    start_time: new Date(state.timer.startTime).toISOString(),
    end_time: new Date().toISOString(),
    date: getTodayString()
  }
  
  await saveSession(session)
  
  // Reset timer
  resetTimer()
  
  // Update displays
  renderTodaySummary()
  
  alert(`🎉 Well done! You completed a ${sessionMinutes}-minute ${state.timer.category} session!`)
}

function playCompletionSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.value = 800
  oscillator.type = 'sine'
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.5)
}

// Timer Controls
$('#startBtn').onclick = startTimer
$('#pauseBtn').onclick = pauseTimer
$('#resetBtn').onclick = resetTimer

// Quick Duration Buttons
$$('.duration-btn').forEach(btn => {
  btn.onclick = () => {
    const minutes = parseInt(btn.dataset.minutes)
    
    if (state.timer.isRunning) {
      if (!confirm('Timer is running. Reset it?')) return
      pauseTimer()
    }
    
    state.timer.duration = minutes * 60
    state.timer.remaining = minutes * 60
    
    $$('.duration-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    
    updateTimerDisplay()
  }
})

// Activity Selector
$('#activitySelect').onchange = (e) => {
  state.timer.category = e.target.value
  
  const category = state.categories.find(c => c.name === e.target.value)
  if (category) {
    $('#timerIcon').textContent = category.icon
  }
}

// =====================================
// Rendering Functions
// =====================================
function render() {
  renderActivitySelect()
  renderTodaySummary()
  renderCategoriesList()
}

function renderActivitySelect() {
  const select = $('#activitySelect')
  select.innerHTML = state.categories.map(cat => 
    `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`
  ).join('')
  
  // Set icon
  const firstCat = state.categories[0]
  if (firstCat) {
    $('#timerIcon').textContent = firstCat.icon
    state.timer.category = firstCat.name
  }
}

function renderTodaySummary() {
  const today = getTodayString()
  const todaySessions = state.sessions.filter(s => s.date === today)
  
  const totalMinutes = todaySessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  
  $('#todaySessions').textContent = todaySessions.length
  $('#todayTime').textContent = `${hours}h ${mins}m`
  
  // Calculate streak
  const streak = calculateStreak()
  $('#todayStreak').textContent = streak
}

function calculateStreak() {
  const dates = [...new Set(state.sessions.map(s => s.date))].sort().reverse()
  
  let streak = 0
  const today = getTodayString()
  let currentDate = new Date()
  
  for (let i = 0; i < dates.length; i++) {
    const dateStr = currentDate.toISOString().split('T')[0]
    
    if (dates.includes(dateStr)) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }
  
  return streak
}

// =====================================
// Analysis Tab
// =====================================
$$('.range-btn').forEach(btn => {
  btn.onclick = () => {
    state.analysisRange = btn.dataset.range
    $$('.range-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    renderAnalysis()
  }
})

function renderAnalysis() {
  const { start, end } = getDateRange(state.analysisRange)
  const sessions = state.sessions.filter(s => {
    const sessionDate = new Date(s.start_time)
    return sessionDate >= new Date(start) && sessionDate <= new Date(end)
  })
  
  // Stats
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  const avgMinutes = sessions.length > 0 ? Math.floor(totalMinutes / sessions.length) : 0
  
  $('#totalTime').textContent = formatDuration(totalMinutes)
  $('#totalSessions').textContent = sessions.length
  $('#avgSession').textContent = `${avgMinutes}m`
  $('#currentStreak').textContent = calculateStreak()
  
  // Pie chart
  renderPieChart(sessions)
  
  // Recent sessions
  renderRecentSessions(sessions)
}

function renderPieChart(sessions) {
  const categoryTotals = {}
  
  sessions.forEach(s => {
    categoryTotals[s.category] = (categoryTotals[s.category] || 0) + s.duration_minutes
  })
  
  const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)
  
  if (total === 0) {
    $('#pieChart').innerHTML = '<text x="100" y="100" text-anchor="middle" fill="var(--secondary)" font-size="14">No data</text>'
    $('#pieLegend').innerHTML = ''
    return
  }
  
  const svg = $('#pieChart')
  svg.innerHTML = ''
  
  let startAngle = 0
  const legend = $('#pieLegend')
  legend.innerHTML = ''
  
  Object.entries(categoryTotals).forEach(([name, minutes]) => {
    const category = state.categories.find(c => c.name === name)
    const color = category?.color || '#268bd2'
    const percentage = (minutes / total) * 100
    const angle = (minutes / total) * 360
    
    // Create pie slice
    const slice = createPieSlice(100, 100, 80, startAngle, startAngle + angle, color)
    svg.appendChild(slice)
    
    // Create legend item
    const legendItem = document.createElement('div')
    legendItem.className = 'legend-item'
    legendItem.innerHTML = `
      <div class="legend-color" style="background: ${color}"></div>
      <div class="legend-label">${category?.icon || ''} ${name}</div>
      <div class="legend-value">${percentage.toFixed(1)}%</div>
    `
    legend.appendChild(legendItem)
    
    startAngle += angle
  })
}

function createPieSlice(cx, cy, r, startAngle, endAngle, color) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1'
  
  const d = [
    'M', cx, cy,
    'L', start.x, start.y,
    'A', r, r, 0, largeArc, 0, end.x, end.y,
    'Z'
  ].join(' ')
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', d)
  path.setAttribute('fill', color)
  path.setAttribute('stroke', 'var(--theme)')
  path.setAttribute('stroke-width', '2')
  
  return path
}

function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  }
}

function renderRecentSessions(sessions) {
  const list = $('#sessionsList')
  
  if (sessions.length === 0) {
    list.innerHTML = '<div class="empty-state">No sessions yet</div>'
    return
  }
  
  list.innerHTML = sessions.slice(0, 10).map(s => {
    const category = state.categories.find(c => c.name === s.category)
    const date = new Date(s.start_time).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    return `
      <div class="session-item">
        <div class="session-icon">${category?.icon || '📌'}</div>
        <div class="session-info">
          <div class="session-title">${s.category}</div>
          <div class="session-meta">${date}</div>
        </div>
        <div class="session-duration">${s.duration_minutes}m</div>
      </div>
    `
  }).join('')
}

// =====================================
// Settings Tab
// =====================================
function renderSettings() {
  renderCategoriesList()
  
  // Load settings
  $('#autoStartBreak').checked = state.settings.autoStartBreak
  $('#soundEnabled').checked = state.settings.soundEnabled
  $('#breakDuration').value = state.settings.breakDuration
}

function renderCategoriesList() {
  const list = $('#categoriesList')
  
  list.innerHTML = state.categories.map(cat => `
    <div class="category-item" data-id="${cat.id}">
      <div class="category-icon" style="background: ${cat.color}20; color: ${cat.color}">
        ${cat.icon}
      </div>
      <div class="category-name">${cat.name}</div>
    </div>
  `).join('')
  
  // Add click handlers
  $$('.category-item').forEach(item => {
    item.onclick = () => {
      const id = item.dataset.id
      const category = state.categories.find(c => c.id === id)
      openCategoryModal(category)
    }
  })
}

// Category Modal
const categoryModal = $('#categoryModal')

function openCategoryModal(category = null) {
  $('#modalTitle').textContent = category ? 'Edit Category' : 'Add Category'
  $('#categoryId').value = category?.id || ''
  $('#categoryName').value = category?.name || ''
  $('#categoryIcon').value = category?.icon || ''
  $('#categoryColor').value = category?.color || '#268bd2'
  
  $('#deleteCategoryBtn').style.display = category ? 'block' : 'none'
  
  categoryModal.showModal()
}

$('#addCategoryBtn').onclick = () => openCategoryModal()

$('#categoryForm').onsubmit = async (e) => {
  e.preventDefault()
  
  const id = $('#categoryId').value || uid()
  const name = $('#categoryName').value.trim()
  
  // Check if category name already exists (excluding current category being edited)
  const existingCategory = state.categories.find(c => 
    c.name.toLowerCase() === name.toLowerCase() && c.id !== id
  )
  
  if (existingCategory) {
    alert(`カテゴリー "${name}" はすでに存在します。別の名前を使用してください。`)
    return
  }
  
  const category = {
    id,
    name,
    icon: $('#categoryIcon').value.trim(),
    color: $('#categoryColor').value
  }
  
  try {
    await saveCategory(category)
    categoryModal.close()
    render()
  } catch (error) {
    console.error('Save error:', error)
    if (error.message?.includes('duplicate key')) {
      alert('このカテゴリー名はすでに使用されています。別の名前を選んでください。')
    } else {
      alert('カテゴリーの保存に失敗しました: ' + error.message)
    }
  }
}

$('#deleteCategoryBtn').onclick = async () => {
  const id = $('#categoryId').value
  if (!id) return
  
  if (confirm('Delete this category? Sessions will not be deleted.')) {
    try {
      await deleteCategory(id)
      categoryModal.close()
      render()
    } catch (error) {
      alert('Failed to delete category: ' + error.message)
    }
  }
}

// Icon and color suggestions
$$('.icon-btn-small').forEach(btn => {
  btn.onclick = () => {
    $('#categoryIcon').value = btn.dataset.icon
  }
})

$$('.color-btn').forEach(btn => {
  btn.onclick = () => {
    $('#categoryColor').value = btn.dataset.color
  }
})

// Settings changes
$('#autoStartBreak').onchange = async (e) => {
  state.settings.autoStartBreak = e.target.checked
  await saveSettings()
}

$('#soundEnabled').onchange = async (e) => {
  state.settings.soundEnabled = e.target.checked
  await saveSettings()
}

$('#breakDuration').onchange = async (e) => {
  state.settings.breakDuration = parseInt(e.target.value)
  await saveSettings()
}

// Data Management
$('#exportDataBtn').onclick = () => {
  const data = {
    categories: state.categories,
    sessions: state.sessions,
    settings: state.settings
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `focus-timer-${getTodayString()}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

$('#importDataFile').onchange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    
    if (!confirm('This will overwrite existing data. Continue?')) {
      e.target.value = ''
      return
    }
    
    // Import categories
    if (data.categories) {
      for (const cat of data.categories) {
        await saveCategory(cat)
      }
    }
    
    // Import sessions
    if (data.sessions) {
      for (const session of data.sessions) {
        await saveSession(session)
      }
    }
    
    // Import settings
    if (data.settings) {
      state.settings = data.settings
      await saveSettings()
    }
    
    alert('Data imported successfully!')
    render()
  } catch (error) {
    alert('Import failed: ' + error.message)
  }
  
  e.target.value = ''
}

$('#clearDataBtn').onclick = async () => {
  if (!confirm('Delete ALL data? This cannot be undone!')) return
  if (!confirm('Are you absolutely sure? All sessions and categories will be deleted.')) return
  
  try {
    await clearAllData()
    alert('All data cleared.')
    render()
  } catch (error) {
    alert('Failed to clear data: ' + error.message)
  }
}