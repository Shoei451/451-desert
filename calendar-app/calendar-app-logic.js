
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

    // =====================================
    // Supabase Configuration
    // =====================================
    const SUPABASE_URL = 'https://abfuanjincelcyrlswsp.supabase.co'
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZnVhbmppbmNlbGN5cmxzd3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjE4MDIsImV4cCI6MjA4MzQzNzgwMn0.OD7371E7A1ZRiqF6SGXnp2JSzPowg2zTt-V36GQ7x9A'
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // =====================================
    // 🔒 AUTH CHECK - MUST BE FIRST!
    // =====================================
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.replace('index.html')
      throw new Error('Not authenticated')
    }

    // =====================================
    // State Management
    // =====================================
    const state = {
      user: null,
      events: [],
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
      filterCourse: '',
      filterType: ''
    }

    // =====================================
    // Utility Functions
    // =====================================
    const $ = (sel, el = document) => el.querySelector(sel)
    const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel))

    const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

    const colorFromCourse = (name) => {
      if (!name) return '#64748b'
      let h = 0
      for (let i = 0; i < name.length; i++) {
        h = (h * 31 + name.charCodeAt(i)) % 360
      }
      return `hsl(${h}, 70%, 50%)`
    }

    const colorFromType = (type) => {
      const typeColors = {
        '時程変更': '#8a9990',
        '試験': '#e63946',
        '定期試験 / 学校模試': '#f7a500',
        '東進模試': '#009c88',
        '部活動': '#00c3ff',
        '長期休み': '#ff6b9d'
      }
      return typeColors[type] || null
    }

    function formatDate(d) {
      const dt = d instanceof Date ? d : new Date(d)
      return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0')
    }

    function escapeHtml(s) {
      return (s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]))
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

    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const monthSelect = $('#monthSelect')
    const yearSelect = $('#yearSelect')

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
    // Initialize App with Authenticated User
    // =====================================
    state.user = session.user
    $('#userEmail').textContent = session.user.email
    mainApp.style.display = 'block'
    await loadEvents()
    setTimeout(() => render(), 100)

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        window.location.replace('index.html')
      }
    })

    logoutBtn.onclick = async () => {
      if (confirm('ログアウトしますか？')) {
        await supabase.auth.signOut()
      }
    }

    // =====================================
    // Supabase Event Management
    // =====================================
    async function loadEvents() {
      try {
        updateSyncStatus('syncing')
        const { data, error } = await supabase
          .from('calendar_app')
          .select('*')
          .eq('user_id', state.user.id)
          .order('date', { ascending: true })

        if (error) throw error

        state.events = data || []
        render()
        updateSyncStatus('synced')
      } catch (error) {
        console.error('Error loading events:', error)
        updateSyncStatus('error')
      }
    }

    async function saveEvent(event) {
      try {
        updateSyncStatus('syncing')
        const eventData = {
          ...event,
          user_id: state.user.id
        }

        const { data, error } = await supabase
          .from('calendar_app')
          .upsert(eventData)
          .select()

        if (error) throw error

        await loadEvents()
        updateSyncStatus('synced')
        return data
      } catch (error) {
        console.error('Error saving event:', error)
        updateSyncStatus('error')
        throw error
      }
    }

    async function deleteEvent(id) {
      try {
        updateSyncStatus('syncing')
        const { error } = await supabase
          .from('calendar_app')
          .delete()
          .eq('id', id)
          .eq('user_id', state.user.id)

        if (error) throw error

        await loadEvents()
        updateSyncStatus('synced')
      } catch (error) {
        console.error('Error deleting event:', error)
        updateSyncStatus('error')
        throw error
      }
    }

    async function deleteEventGroup(groupId) {
      try {
        updateSyncStatus('syncing')
        const { error } = await supabase
          .from('calendar_app')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', state.user.id)

        if (error) throw error

        await loadEvents()
        updateSyncStatus('synced')
      } catch (error) {
        console.error('Error deleting event group:', error)
        updateSyncStatus('error')
        throw error
      }
    }

    async function updateEventGroup(groupId, updates) {
      try {
        updateSyncStatus('syncing')
        const { error } = await supabase
          .from('calendar_app')
          .update(updates)
          .eq('group_id', groupId)
          .eq('user_id', state.user.id)

        if (error) throw error

        await loadEvents()
        updateSyncStatus('synced')
      } catch (error) {
        console.error('Error updating event group:', error)
        updateSyncStatus('error')
        throw error
      }
    }

    async function clearAllEvents() {
      try {
        updateSyncStatus('syncing')
        const { error } = await supabase
          .from('calendar_app')
          .delete()
          .eq('user_id', state.user.id)

        if (error) throw error

        await loadEvents()
        updateSyncStatus('synced')
      } catch (error) {
        console.error('Error clearing events:', error)
        updateSyncStatus('error')
        throw error
      }
    }

    supabase
      .channel('events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_app' }, (payload) => {
        if (state.user && payload.new?.user_id === state.user.id) {
          loadEvents()
        }
      })
      .subscribe()

    // =====================================
    // Calendar Rendering
    // =====================================
    for (let m = 0; m < 12; m++) {
      const opt = document.createElement('option')
      opt.value = m
      opt.textContent = monthNames[m]
      monthSelect.appendChild(opt)
    }

    const thisYear = new Date().getFullYear()
    for (let y = thisYear - 3; y <= thisYear + 3; y++) {
      const opt = document.createElement('option')
      opt.value = y
      opt.textContent = y + '年'
      yearSelect.appendChild(opt)
    }

    function render() {
      if (!monthSelect || !yearSelect) {
        return
      }
      
      monthSelect.value = state.month
      yearSelect.value = state.year
      renderLegend()
      renderCalendar()
      renderDashboard()
      fillCourseDatalist()
    }

    function getMonthMatrix(y, m) {
      const days = []
      const firstDay = new Date(y, m, 1)
      let dayOfWeek = firstDay.getDay()
      dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      
      for (let i = 0; i < dayOfWeek; i++) {
        days.push(null)
      }
      
      const last = new Date(y, m + 1, 0).getDate()
      for (let d = 1; d <= last; d++) {
        days.push(new Date(y, m, d))
      }
      return days
    }

    function renderCalendar() {
      const cal = $('#calendar')
      cal.innerHTML = ''
      const dows = ['月', '火', '水', '木', '金', '土', '日']
      dows.forEach(d => {
        const h = document.createElement('div')
        h.className = 'dow'
        h.textContent = d
        cal.appendChild(h)
      })

      const cells = getMonthMatrix(state.year, state.month)
      const todayStr = formatDate(new Date())

      const filtered = state.events.filter(e =>
        (!state.filterCourse || e.course === state.filterCourse) &&
        (!state.filterType || e.type === state.filterType)
      )

      const counts = {}
      filtered.forEach(e => {
        counts[e.date] = (counts[e.date] || 0) + 1
      })

      cells.forEach(d => {
        const cell = document.createElement('div')
        
        if (d === null) {
          cell.className = 'cell'
          cell.style.background = 'transparent'
          cell.style.pointerEvents = 'none'
          cal.appendChild(cell)
          return
        }
        
        const dStr = formatDate(d)
        const inMonth = d.getMonth() === state.month
        cell.className = 'cell heat-' + Math.min(4, counts[dStr] || 0)
        if (!inMonth) cell.style.opacity = 0.35
        if (dStr === todayStr) cell.classList.add('today')

        const dateEl = document.createElement('div')
        dateEl.className = 'date'
        dateEl.textContent = `${d.getDate()}`
        cell.appendChild(dateEl)

        filtered
          .filter(e => e.date === dStr && inMonth)
          .sort((a, b) => a.title.localeCompare(b.title))
          .slice(0, 4)
          .forEach(e => {
            const chip = document.createElement('div')
            chip.className = 'chip'
            const timeStr = e.start ? ` ${e.start}` : ''
            chip.title = `${e.title}（${e.course || '科目未設定'}）${timeStr}`
            const typeColor = colorFromType(e.type)
            chip.style.background = typeColor || colorFromCourse(e.course)
            chip.style.color = '#fff'
            chip.textContent = `${timeStr ? timeStr + ' ' : ''}${e.title || '無題'}`
            chip.onclick = () => openModal(e)
            cell.appendChild(chip)
          })

        cell.onclick = ev => {
          if (ev.target === cell || ev.target === dateEl) openModal({ date: dStr })
        }

        cal.appendChild(cell)
      })
    }

    function renderLegend() {
      const box = $('#legend')
      box.innerHTML = ''
      const courses = [...new Set(state.events.map(e => e.course).filter(Boolean))].sort()
      const fc = $('#filterCourse')
      fc.innerHTML = '<option value="">すべての科目</option>' + courses.map(c => `<option>${c}</option>`).join('')
      courses.forEach(c => {
        const el = document.createElement('span')
        el.className = 'chip'
        el.textContent = c
        el.style.background = colorFromCourse(c)
        el.style.color = '#fff'
        el.onclick = () => {
          state.filterCourse = state.filterCourse === c ? '' : c
          $('#filterCourse').value = state.filterCourse
          render()
        }
        box.appendChild(el)
      })
    }

    function renderDashboard() {
      const now = new Date()
      const monthStart = new Date(state.year, state.month, 1)
      const monthEnd = new Date(state.year, state.month + 1, 0)

      const filtered = state.events.filter(e =>
        (!state.filterCourse || e.course === state.filterCourse) &&
        (!state.filterType || e.type === state.filterType)
      )
      const inMonth = filtered.filter(e => {
        const d = new Date(e.date)
        return d >= monthStart && d <= monthEnd
      })

      $('#kpiTotal').textContent = inMonth.length
      $('#kpiAll').textContent = filtered.length
      $('#kpiSoon').textContent = filtered.filter(e => {
        const d = new Date(e.date)
        const diff = (d - now) / (1000 * 60 * 60 * 24)
        return diff >= 0 && diff <= 7
      }).length

      const upcoming = filtered
        .filter(e => new Date(e.date) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 20)

      const box = $('#upcoming')
      box.innerHTML = ''
      if (upcoming.length === 0) {
        box.innerHTML = '<div class="hint">直近の予定はありません。</div>'
        return
      }
      upcoming.forEach(e => {
        const it = document.createElement('div')
        it.className = 'item'
        const left = document.createElement('div')
        const timeStr = e.start ? ` ${e.start}${e.end ? '-' + e.end : ''}` : ''
        left.innerHTML = `<div><strong>${escapeHtml(e.title || '無題')}</strong></div>
          <div class="meta">${e.date}${timeStr} ／ ${e.course || '科目未設定'} ／ ${e.type}</div>
          ${e.notes ? `<div class="hint">${escapeHtml(e.notes)}</div>` : ''}`
        const right = document.createElement('div')
        right.style.display = 'flex'
        right.style.flexDirection = 'column'
        right.style.gap = '6px'
        right.style.alignItems = 'end'
        const edit = document.createElement('button')
        edit.textContent = '編集'
        edit.onclick = () => openModal(e)
        right.appendChild(edit)
        it.appendChild(left)
        it.appendChild(right)
        box.appendChild(it)
      })
    }

    function fillCourseDatalist() {
      const list = $('#courseList')
      list.innerHTML = ''
      ;[...new Set(state.events.map(e => e.course).filter(Boolean))].sort().forEach(c => {
        const opt = document.createElement('option')
        opt.value = c
        list.appendChild(opt)
      })
    }

    // =====================================
    // Event Modal
    // =====================================
    const eventModal = $('#eventModal')

    function updateCourseVisibility() {
      const type = $('#type').value
      const courseLabel = $('#courseLabel')
      const courseInput = $('#course')
      const noCourseTypes = ['時程変更', '試験', '定期試験 / 学校模試', '東進模試', '部活動', '長期休み']

      if (noCourseTypes.includes(type)) {
        courseInput.disabled = true
        courseInput.style.background = '#e2e8f0'
        courseInput.style.color = '#94a3b8'
        courseLabel.style.opacity = '0.5'
      } else {
        courseInput.disabled = false
        courseInput.style.background = 'var(--panel)'
        courseInput.style.color = 'var(--text)'
        courseLabel.style.opacity = '1'
      }
    }

    function toggleMultiDate() {
      const isMulti = $('#multiDate').checked
      $('#endDateRow').style.display = isMulti ? '' : 'none'
      $('#multiDateHint').style.display = isMulti ? 'block' : 'none'
      if (isMulti) {
        $('#endDate').required = true
      } else {
        $('#endDate').required = false
      }
    }

    function openModal(e = {}) {
      const isGrouped = e.group_id && state.events.filter(ev => ev.group_id === e.group_id).length > 1
      
      $('#modalTitle').textContent = e.id ? '予定を編集' : '予定を追加'
      $('#eventId').value = e.id || ''
      $('#groupId').value = e.group_id || ''
      $('#title').value = e.title || ''
      $('#course').value = e.course || ''
      $('#date').value = e.date || formatDate(new Date(state.year, state.month, 1))
      $('#endDate').value = ''
      $('#multiDate').checked = false
      $('#type').value = e.type || '課題提出日'
      $('#notes').value = e.notes || ''
      
      if (isGrouped) {
        $('#groupWarning').style.display = 'block'
        const groupEvents = state.events.filter(ev => ev.group_id === e.group_id)
        const dates = groupEvents.map(ev => ev.date).sort()
        $('#groupWarning').innerHTML = `⚠️ この予定は${dates[0]}〜${dates[dates.length-1]}の${groupEvents.length}日間のグループ予定です。編集すると全ての日付に反映されます。`
      } else {
        $('#groupWarning').style.display = 'none'
      }
      
      updateCourseVisibility()
      toggleMultiDate()
      $('#deleteBtn').style.display = e.id ? '' : 'none'
      eventModal.showModal()
      setTimeout(() => $('#title').focus(), 50)
    }

    $('#type').addEventListener('change', updateCourseVisibility)
    $('#multiDate').addEventListener('change', toggleMultiDate)

    $('#eventForm').addEventListener('submit', async (ev) => {
      ev.preventDefault()
      const id = $('#eventId').value || uid()
      const groupId = $('#groupId').value
      const isMulti = $('#multiDate').checked
      const startDate = $('#date').value
      const endDate = $('#endDate').value

      const evObj = {
        title: $('#title').value.trim() || '無題',
        course: $('#course').value.trim(),
        type: $('#type').value,
        notes: $('#notes').value.trim()
      }

      try {
        if (isMulti && endDate && endDate >= startDate) {
          const start = new Date(startDate)
          const end = new Date(endDate)
          const newGroupId = uid()

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = formatDate(d)
            const newId = uid()
            await saveEvent({
              ...evObj,
              id: newId,
              group_id: newGroupId,
              date: dateStr
            })
          }
        } else if (groupId && state.events.filter(e => e.group_id === groupId).length > 1) {
          await updateEventGroup(groupId, evObj)
        } else {
          await saveEvent({
            ...evObj,
            id,
            group_id: groupId || null,
            date: startDate
          })
        }

        eventModal.close()
        render()
      } catch (error) {
        alert('保存に失敗しました: ' + error.message)
      }
    })

    $('#deleteBtn').onclick = async () => {
      const id = $('#eventId').value
      const groupId = $('#groupId').value
      if (!id) return
      
      const isGrouped = groupId && state.events.filter(e => e.group_id === groupId).length > 1
      
      if (isGrouped) {
        const groupEvents = state.events.filter(e => e.group_id === groupId)
        if (confirm(`この予定は${groupEvents.length}日間のグループ予定です。全ての日付を削除しますか？\n\n個別の日だけ削除したい場合は「キャンセル」を押してください。`)) {
          try {
            await deleteEventGroup(groupId)
            eventModal.close()
            render()
          } catch (error) {
            alert('削除に失敗しました: ' + error.message)
          }
        } else {
          if (confirm('この日だけ削除しますか？')) {
            try {
              await deleteEvent(id)
              eventModal.close()
              render()
            } catch (error) {
              alert('削除に失敗しました: ' + error.message)
            }
          }
        }
      } else {
        if (confirm('この予定を削除しますか？')) {
          try {
            await deleteEvent(id)
            eventModal.close()
            render()
          } catch (error) {
            alert('削除に失敗しました: ' + error.message)
          }
        }
      }
    }

    // =====================================
    // Navigation Controls
    // =====================================
    $('#prevBtn').onclick = () => {
      const d = new Date(state.year, state.month - 1, 1)
      state.year = d.getFullYear()
      state.month = d.getMonth()
      render()
    }

    $('#nextBtn').onclick = () => {
      const d = new Date(state.year, state.month + 1, 1)
      state.year = d.getFullYear()
      state.month = d.getMonth()
      render()
    }

    $('#todayBtn').onclick = () => {
      const now = new Date()
      state.year = now.getFullYear()
      state.month = now.getMonth()
      state.filterCourse = ''
      state.filterType = ''
      render()
    }

    monthSelect.onchange = () => {
      state.month = Number(monthSelect.value)
      render()
    }

    yearSelect.onchange = () => {
      state.year = Number(yearSelect.value)
      render()
    }

    $('#filterCourse').onchange = e => {
      state.filterCourse = e.target.value
      render()
    }

    $('#filterType').onchange = e => {
      state.filterType = e.target.value
      render()
    }

    $('#addBtn').onclick = () => openModal({ date: formatDate(new Date(state.year, state.month, 1)) })

    // =====================================
    // Export/Import/Clear
    // =====================================
    $('#exportBtn').onclick = () => {
      const blob = new Blob([JSON.stringify(state.events, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'student-calendar-data.json'
      a.click()
      URL.revokeObjectURL(a.href)
    }

    $('#importFile').onchange = async e => {
      const file = e.target.files[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (!Array.isArray(data)) throw new Error('JSON形式が不正です')

        for (const ev of data) {
          if (!ev.id) ev.id = uid()
          await saveEvent(ev)
        }

        alert('インポートしました。')
      } catch (err) {
        alert('インポートに失敗: ' + err.message)
      }
      e.target.value = ''
    }

    $('#clearBtn').onclick = async () => {
      if (confirm('本当に全データを削除しますか？この操作は取り消せません。')) {
        try {
          await clearAllEvents()
        } catch (error) {
          alert('削除に失敗しました: ' + error.message)
        }
      }
    }
  