/**
 * HABSTRA - Simple, Clean Habit Tracker
 * Pure Vanilla JavaScript (No backend, no server, browser localStorage)
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Constants & State ---
  const STORAGE_KEY = 'habstra_habits_v1';
  let habits = [];
  let habitToDeleteId = null;
  let currentSearchQuery = '';

  // --- DOM Elements ---
  // Stats
  const totalHabitsCountEl = document.getElementById('totalHabitsCount');
  const doneTodayCountEl = document.getElementById('doneTodayCount');
  const bestStreakCountEl = document.getElementById('bestStreakCount');

  // Add Habit Form
  const addHabitForm = document.getElementById('addHabitForm');
  const habitNameInput = document.getElementById('habitName');
  const habitGoalInput = document.getElementById('habitGoal');
  const habitStartDateInput = document.getElementById('habitStartDate');
  const nameError = document.getElementById('nameError');
  const goalError = document.getElementById('goalError');
  const startDateError = document.getElementById('startDateError');

  // Search & List
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchStatusEl = document.getElementById('searchStatus');
  const habitsContainer = document.getElementById('habitsContainer');
  const emptyStateEl = document.getElementById('emptyState');
  const noResultsStateEl = document.getElementById('noResultsState');
  const seedExampleBtn = document.getElementById('seedExampleBtn');
  const resetSearchBtn = document.getElementById('resetSearchBtn');

  // Edit Modal Elements
  const editModal = document.getElementById('editModal');
  const editHabitForm = document.getElementById('editHabitForm');
  const editHabitIdInput = document.getElementById('editHabitId');
  const editHabitNameInput = document.getElementById('editHabitName');
  const editHabitGoalInput = document.getElementById('editHabitGoal');
  const editHabitStartDateInput = document.getElementById('editHabitStartDate');
  const editNameError = document.getElementById('editNameError');
  const editGoalError = document.getElementById('editGoalError');
  const editStartDateError = document.getElementById('editStartDateError');
  const closeEditModalBtn = document.getElementById('closeEditModalBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  // Delete Modal Elements
  const deleteModal = document.getElementById('deleteModal');
  const deleteHabitNameEl = document.getElementById('deleteHabitName');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // --- Date Utility Helpers ---
  /**
   * Formats a Date object to YYYY-MM-DD string using local time
   */
  function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formats YYYY-MM-DD into a readable date string (e.g., Nov 8, 2026)
   */
  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Returns true if habit was completed today
   */
  function isCompletedToday(completedDates) {
    if (!Array.isArray(completedDates)) return false;
    const todayStr = getLocalDateString(new Date());
    return completedDates.includes(todayStr);
  }

  /**
   * Calculates consecutive days streak:
   * - Goes up by 1 each day ticked
   * - Resets to 0 if a day was missed
   * - If yesterday was completed and today is pending, maintains yesterday's streak
   */
  function calculateStreak(completedDates) {
    if (!Array.isArray(completedDates) || completedDates.length === 0) {
      return 0;
    }

    const dateSet = new Set(completedDates);
    const today = new Date();
    const todayStr = getLocalDateString(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    let streak = 0;
    let checkDate = new Date(today);

    if (dateSet.has(todayStr)) {
      // Completed today -> count backwards starting from today
      while (dateSet.has(getLocalDateString(checkDate))) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    } else if (dateSet.has(yesterdayStr)) {
      // Completed yesterday -> active streak pending today's check
      checkDate = new Date(yesterday);
      while (dateSet.has(getLocalDateString(checkDate))) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    } else {
      // Neither today nor yesterday completed -> streak is 0
      streak = 0;
    }

    return streak;
  }

  // --- LocalStorage Persistence ---
  function loadHabits() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        habits = JSON.parse(data);
        if (!Array.isArray(habits)) {
          habits = [];
        }
      } else {
        habits = [];
      }
    } catch (err) {
      console.error('Failed to parse habits from localStorage:', err);
      habits = [];
    }
  }

  function saveHabits() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (err) {
      console.error('Failed to save habits to localStorage:', err);
      showToast('Could not save data: storage quota exceeded.', 'error');
    }
  }

  // --- Toast Notifications ---
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : ''}`;
    toast.innerHTML = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2800);
  }

  // --- Top Stats Calculation ---
  function updateStats() {
    // Total habits count (explicit requirement: "See the total number of habits at the top")
    const total = habits.length;
    totalHabitsCountEl.textContent = total;

    // Completed today count
    const completedToday = habits.filter(h => isCompletedToday(h.completedDates)).length;
    doneTodayCountEl.textContent = `${completedToday} / ${total}`;

    // Best streak count
    let maxStreak = 0;
    habits.forEach(h => {
      const s = calculateStreak(h.completedDates);
      if (s > maxStreak) maxStreak = s;
    });
    bestStreakCountEl.textContent = `${maxStreak} ${maxStreak === 1 ? 'day' : 'days'}`;
  }

  // --- Render Habits List ---
  function renderHabits() {
    updateStats();

    const query = currentSearchQuery.trim().toLowerCase();
    let filteredHabits = habits;

    if (query) {
      filteredHabits = habits.filter(h => 
        (h.name && h.name.toLowerCase().includes(query)) ||
        (h.goal && h.goal.toLowerCase().includes(query))
      );
      searchStatusEl.textContent = `Showing ${filteredHabits.length} of ${habits.length} ${habits.length === 1 ? 'habit' : 'habits'}`;
      clearSearchBtn.hidden = false;
    } else {
      searchStatusEl.textContent = '';
      clearSearchBtn.hidden = true;
    }

    habitsContainer.innerHTML = '';

    // Check empty states
    if (habits.length === 0) {
      emptyStateEl.hidden = false;
      noResultsStateEl.hidden = true;
      habitsContainer.hidden = true;
      return;
    }

    if (filteredHabits.length === 0) {
      emptyStateEl.hidden = true;
      noResultsStateEl.hidden = false;
      habitsContainer.hidden = true;
      return;
    }

    // List has matching habits
    emptyStateEl.hidden = true;
    noResultsStateEl.hidden = true;
    habitsContainer.hidden = false;

    filteredHabits.forEach(habit => {
      const card = createHabitCard(habit);
      habitsContainer.appendChild(card);
    });
  }

  /**
   * Builds an individual habit card DOM element
   */
  function createHabitCard(habit) {
    const card = document.createElement('article');
    const doneToday = isCompletedToday(habit.completedDates);
    const streak = calculateStreak(habit.completedDates);

    card.className = `habit-card ${doneToday ? 'is-completed' : ''}`;
    card.setAttribute('role', 'listitem');
    card.dataset.id = habit.id;

    // Header with name, streak badge, edit & delete buttons
    const topRow = document.createElement('div');
    topRow.className = 'habit-top-row';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'habit-title-container';

    const nameEl = document.createElement('h3');
    nameEl.className = 'habit-name';
    nameEl.textContent = habit.name;

    titleGroup.appendChild(nameEl);

    const actionsTop = document.createElement('div');
    actionsTop.className = 'habit-actions-top';

    // Streak badge
    const streakBadge = document.createElement('div');
    streakBadge.className = `streak-badge ${streak === 0 ? 'zero' : ''}`;
    streakBadge.title = streak > 0 
      ? `Current active streak: ${streak} day${streak === 1 ? '' : 's'}` 
      : 'Streak resets if a day is missed';
    streakBadge.innerHTML = `
      <span class="streak-icon">🔥</span>
      <span>${streak} ${streak === 1 ? 'day' : 'days'}</span>
    `;

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'icon-btn btn-edit';
    editBtn.setAttribute('aria-label', `Edit ${habit.name}`);
    editBtn.title = 'Edit habit';
    editBtn.innerHTML = `
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    `;
    editBtn.addEventListener('click', () => openEditModal(habit));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'icon-btn btn-delete';
    deleteBtn.setAttribute('aria-label', `Delete ${habit.name}`);
    deleteBtn.title = 'Delete habit';
    deleteBtn.innerHTML = `
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    `;
    deleteBtn.addEventListener('click', () => openDeleteModal(habit));

    actionsTop.appendChild(streakBadge);
    actionsTop.appendChild(editBtn);
    actionsTop.appendChild(deleteBtn);

    topRow.appendChild(titleGroup);
    topRow.appendChild(actionsTop);

    // Details: Daily goal & Start date
    const details = document.createElement('div');
    details.className = 'habit-details';

    const goalEl = document.createElement('div');
    goalEl.className = 'habit-goal';
    goalEl.innerHTML = `
      <svg class="goal-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="6"></circle>
        <circle cx="12" cy="12" r="2"></circle>
      </svg>
      <span><strong>Goal:</strong> ${escapeHtml(habit.goal)}</span>
    `;

    const startDateEl = document.createElement('div');
    startDateEl.className = 'habit-start-date';
    startDateEl.innerHTML = `
      <svg class="calendar-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <span>Started ${formatDisplayDate(habit.startDate)}</span>
    `;

    details.appendChild(goalEl);
    details.appendChild(startDateEl);

    // Footer: Status & "Done today" action button
    const footer = document.createElement('div');
    footer.className = 'habit-footer';

    const statusPill = document.createElement('div');
    statusPill.className = `habit-status-pill ${doneToday ? 'status-done' : ''}`;
    statusPill.innerHTML = `
      <span class="status-dot ${doneToday ? 'active' : ''}"></span>
      <span>${doneToday ? 'Completed today' : 'Pending today'}</span>
    `;

    const doneBtn = document.createElement('button');
    doneBtn.type = 'button';

    if (doneToday) {
      // Completed state: button disabled, can only be tapped once per day
      doneBtn.className = 'btn-done-action completed';
      doneBtn.disabled = true;
      doneBtn.setAttribute('aria-disabled', 'true');
      doneBtn.title = 'You completed this habit today!';
      doneBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Done today</span>
      `;
    } else {
      // Active state: ready to mark done
      doneBtn.className = 'btn-done-action ready';
      doneBtn.setAttribute('aria-label', `Mark ${habit.name} as done today`);
      doneBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Done today</span>
      `;
      doneBtn.addEventListener('click', () => {
        markHabitDoneToday(habit.id);
      });
    }

    footer.appendChild(statusPill);
    footer.appendChild(doneBtn);

    card.appendChild(topRow);
    card.appendChild(details);
    card.appendChild(footer);

    return card;
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- Mark Done Today (Only once per day) ---
  function markHabitDoneToday(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    if (!Array.isArray(habit.completedDates)) {
      habit.completedDates = [];
    }

    const todayStr = getLocalDateString(new Date());

    // Check if already completed today (protection against duplicate taps)
    if (habit.completedDates.includes(todayStr)) {
      showToast('Already completed for today!', 'info');
      return;
    }

    // Add today's completion
    habit.completedDates.push(todayStr);
    saveHabits();

    const newStreak = calculateStreak(habit.completedDates);
    showToast(`Great work! "<strong>${escapeHtml(habit.name)}</strong>" done today! 🔥 Streak: ${newStreak}`, 'success');

    renderHabits();
  }

  // --- Add Habit Form Handling ---
  addHabitForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = habitNameInput.value.trim();
    const goal = habitGoalInput.value.trim();
    const startDate = habitStartDateInput.value;

    let hasError = false;

    if (!name) {
      nameError.classList.add('visible');
      habitNameInput.focus();
      hasError = true;
    } else {
      nameError.classList.remove('visible');
    }

    if (!goal) {
      goalError.classList.add('visible');
      if (!hasError) habitGoalInput.focus();
      hasError = true;
    } else {
      goalError.classList.remove('visible');
    }

    if (!startDate) {
      startDateError.classList.add('visible');
      if (!hasError) habitStartDateInput.focus();
      hasError = true;
    } else {
      startDateError.classList.remove('visible');
    }

    if (hasError) return;

    // Create new habit object
    const newHabit = {
      id: 'habit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name: name,
      goal: goal,
      startDate: startDate,
      completedDates: [],
      createdAt: Date.now()
    };

    habits.unshift(newHabit);
    saveHabits();

    // Reset form & restore default start date
    addHabitForm.reset();
    habitStartDateInput.value = getLocalDateString(new Date());

    renderHabits();
    showToast(`Habit "<strong>${escapeHtml(name)}</strong>" added! 🌱`, 'success');
  });

  // Clear validation error on input
  habitNameInput.addEventListener('input', () => nameError.classList.remove('visible'));
  habitGoalInput.addEventListener('input', () => goalError.classList.remove('visible'));
  habitStartDateInput.addEventListener('input', () => startDateError.classList.remove('visible'));

  // --- Edit Habit Modal Handling ---
  function openEditModal(habit) {
    editHabitIdInput.value = habit.id;
    editHabitNameInput.value = habit.name;
    editHabitGoalInput.value = habit.goal;
    editHabitStartDateInput.value = habit.startDate;

    editNameError.classList.remove('visible');
    editGoalError.classList.remove('visible');
    editStartDateError.classList.remove('visible');

    editModal.hidden = false;
    // Trigger transition after unhiding
    requestAnimationFrame(() => {
      editModal.classList.add('active');
      editHabitNameInput.focus();
    });
  }

  function closeEditModal() {
    editModal.classList.remove('active');
    setTimeout(() => {
      editModal.hidden = true;
    }, 200);
  }

  editHabitForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = editHabitIdInput.value;
    const name = editHabitNameInput.value.trim();
    const goal = editHabitGoalInput.value.trim();
    const startDate = editHabitStartDateInput.value;

    let hasError = false;

    if (!name) {
      editNameError.classList.add('visible');
      editHabitNameInput.focus();
      hasError = true;
    } else {
      editNameError.classList.remove('visible');
    }

    if (!goal) {
      editGoalError.classList.add('visible');
      if (!hasError) editHabitGoalInput.focus();
      hasError = true;
    } else {
      editGoalError.classList.remove('visible');
    }

    if (!startDate) {
      editStartDateError.classList.add('visible');
      if (!hasError) editHabitStartDateInput.focus();
      hasError = true;
    } else {
      editStartDateError.classList.remove('visible');
    }

    if (hasError) return;

    const habitIndex = habits.findIndex(h => h.id === id);
    if (habitIndex !== -1) {
      habits[habitIndex].name = name;
      habits[habitIndex].goal = goal;
      habits[habitIndex].startDate = startDate;

      saveHabits();
      renderHabits();
      closeEditModal();
      showToast(`Updated "<strong>${escapeHtml(name)}</strong>"`, 'success');
    }
  });

  closeEditModalBtn.addEventListener('click', closeEditModal);
  cancelEditBtn.addEventListener('click', closeEditModal);

  editHabitNameInput.addEventListener('input', () => editNameError.classList.remove('visible'));
  editHabitGoalInput.addEventListener('input', () => editGoalError.classList.remove('visible'));
  editHabitStartDateInput.addEventListener('input', () => editStartDateError.classList.remove('visible'));

  // --- Delete Habit Modal Handling (Confirm before delete) ---
  function openDeleteModal(habit) {
    habitToDeleteId = habit.id;
    deleteHabitNameEl.textContent = `"${habit.name}"`;
    deleteModal.hidden = false;
    requestAnimationFrame(() => {
      deleteModal.classList.add('active');
      confirmDeleteBtn.focus();
    });
  }

  function closeDeleteModal() {
    deleteModal.classList.remove('active');
    setTimeout(() => {
      deleteModal.hidden = true;
      habitToDeleteId = null;
    }, 200);
  }

  confirmDeleteBtn.addEventListener('click', () => {
    if (!habitToDeleteId) return;

    const habitIndex = habits.findIndex(h => h.id === habitToDeleteId);
    if (habitIndex !== -1) {
      const removedHabit = habits.splice(habitIndex, 1)[0];
      saveHabits();
      renderHabits();
      showToast(`Deleted "<strong>${escapeHtml(removedHabit.name)}</strong>"`, 'info');
    }

    closeDeleteModal();
  });

  cancelDeleteBtn.addEventListener('click', closeDeleteModal);

  // Close modals on clicking backdrop
  [editModal, deleteModal].forEach(modalEl => {
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) {
        if (modalEl === editModal) closeEditModal();
        if (modalEl === deleteModal) closeDeleteModal();
      }
    });
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!editModal.hidden) closeEditModal();
      if (!deleteModal.hidden) closeDeleteModal();
    }
  });

  // --- Search Filtering ---
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    renderHabits();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchQuery = '';
    renderHabits();
    searchInput.focus();
  });

  resetSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchQuery = '';
    renderHabits();
    searchInput.focus();
  });

  // --- Example Habits Starter ---
  seedExampleBtn.addEventListener('click', () => {
    const today = new Date();
    const todayStr = getLocalDateString(today);

    const d1 = new Date(today);
    d1.setDate(d1.getDate() - 1);
    const d1Str = getLocalDateString(d1);

    const d2 = new Date(today);
    d2.setDate(d2.getDate() - 2);
    const d2Str = getLocalDateString(d2);

    const d3 = new Date(today);
    d3.setDate(d3.getDate() - 3);
    const d3Str = getLocalDateString(d3);

    const startWeek = new Date(today);
    startWeek.setDate(startWeek.getDate() - 7);
    const startWeekStr = getLocalDateString(startWeek);

    habits = [
      {
        id: 'sample_1',
        name: 'Drink 2 Liters of Water',
        goal: 'Drink 8 cups throughout the day',
        startDate: startWeekStr,
        completedDates: [d3Str, d2Str, d1Str, todayStr],
        createdAt: Date.now() - 3000
      },
      {
        id: 'sample_2',
        name: 'Read for 20 Minutes',
        goal: 'Read 20 pages of a book before bed',
        startDate: startWeekStr,
        completedDates: [d2Str, d1Str],
        createdAt: Date.now() - 2000
      },
      {
        id: 'sample_3',
        name: 'Morning Stretching',
        goal: '10 minutes of gentle yoga & stretches',
        startDate: todayStr,
        completedDates: [],
        createdAt: Date.now() - 1000
      }
    ];

    saveHabits();
    renderHabits();
    showToast('Loaded 3 example habits! 🎉', 'success');
  });

  // --- Data Export & Import Backup ---
  const exportDataBtn = document.getElementById('exportDataBtn');
  const importDataBtn = document.getElementById('importDataBtn');
  const importFileInput = document.getElementById('importFileInput');

  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', () => {
      const dataStr = JSON.stringify(habits, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habstra-backup-${getLocalDateString(new Date())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Data exported successfully! 📁', 'success');
    });
  }

  if (importDataBtn && importFileInput) {
    importDataBtn.addEventListener('click', () => {
      importFileInput.value = '';
      importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported)) {
            habits = imported;
            saveHabits();
            renderHabits();
            showToast('Data restored successfully! 🎉', 'success');
          } else {
            showToast('Invalid data file format.', 'error');
          }
        } catch (err) {
          console.error(err);
          showToast('Failed to read file: invalid JSON.', 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  // --- Day Rollover Detection ---
  let lastCheckedDate = getLocalDateString(new Date());

  function checkDateRollover() {
    const currentDate = getLocalDateString(new Date());
    if (currentDate !== lastCheckedDate) {
      lastCheckedDate = currentDate;
      habitStartDateInput.value = currentDate;
      renderHabits();
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkDateRollover();
    }
  });

  setInterval(checkDateRollover, 60000);

  // --- Initialize Application ---
  habitStartDateInput.value = getLocalDateString(new Date());
  loadHabits();
  renderHabits();
});

