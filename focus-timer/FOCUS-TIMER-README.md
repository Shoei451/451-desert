# Focus Timer App - Setup Guide

A beautiful, Solarized-themed focus timer app to track your productivity across different activities. Features circular progress visualization, detailed analytics, and cloud sync via Supabase.

## ✨ Features

### Timer Tab
- **Circular Progress Timer**: Beautiful animated circular progress indicator
- **Custom Categories**: Create and customize your own focus categories with icons and colors
- **Quick Duration Presets**: 15m, 25m, 45m, 60m buttons for fast setup
- **Today's Summary**: View sessions, total time, and streak at a glance
- **Sound Notifications**: Optional sound when sessions complete

### Analysis Tab
- **Time Range Selection**: View data by Daily, Weekly, or Monthly
- **Statistics Overview**: Total time, sessions, average session length, and streak
- **Category Breakdown**: Visual pie chart showing time distribution across categories
- **Recent Sessions List**: Detailed list of your recent focus sessions

### Settings Tab
- **Category Management**: Add, edit, and delete custom categories
- **Timer Preferences**: Auto-start breaks, sound notifications, break duration
- **Data Management**: Export/import data as JSON, clear all data
- **Solarized Theme**: Beautiful light/dark mode toggle

## 📋 Prerequisites

- A [Supabase](https://supabase.com) account (free tier works great!)
- Basic web hosting (GitHub Pages, Netlify, Vercel, or any static host)
- Your existing 451-Solarized project files

## 🚀 Setup Instructions

### Step 1: Database Setup

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **SQL Editor** (left sidebar)
4. Copy the contents of `supabase-focus-setup.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the script

This creates three tables:
- `focus_categories` - Your custom focus categories
- `focus_sessions` - Completed focus sessions
- `focus_settings` - User preferences

### Step 2: File Deployment

Add these files to your project:

```
your-project/
├── focus-timer-app.html         # Main app file
├── css/
│   └── solar-focus-style.css    # Styles
├── js/
│   └── focus-timer-app.js       # App logic
├── images/
│   └── favicon-solar.png        # (already exists)
└── supabase-focus-setup.sql     # Database setup script
```

### Step 3: Add to Navigation

Update your `index.html` to include a link to the Focus Timer:

```html
<a href="focus-timer-app.html" class="card">
    <div class="card-icon">⏱️</div>
    <h3>Focus Timer</h3>
    <p>Track your focus time across different activities</p>
</a>
```

### Step 4: Verify Supabase Credentials

The app uses the same Supabase credentials as your other 451-Solarized apps:
- URL: `https://abfuanjincelcyrlswsp.supabase.co`
- Anon Key: (already in the code)

If you need to change these, update them in `focus-timer-app.js` at the top of the file.

## 📱 How to Use

### Starting a Focus Session

1. **Select Activity**: Choose your activity from the dropdown (Study, Coding, Rest, etc.)
2. **Set Duration**: Click one of the quick duration buttons (15m, 25m, 45m, 60m)
3. **Start Timer**: Click the green "Start" button
4. **Focus**: The circular progress will animate as you work
5. **Complete**: When the timer ends, you'll hear a sound (if enabled) and see a completion message

### Managing Categories

1. Go to the **Settings** tab
2. Click on any category to edit it
3. Click **"+ Add Category"** to create a new one
4. Choose an icon (emoji), name, and color
5. Delete categories by clicking "Delete" in the edit modal

### Viewing Analytics

1. Go to the **Analysis** tab
2. Select time range: Daily, Weekly, or Monthly
3. View:
   - Total focus time and sessions
   - Average session length
   - Current streak
   - Pie chart showing time per category
   - List of recent sessions

### Exporting/Importing Data

**To Export:**
1. Go to **Settings** tab
2. Click **"Export Data"**
3. Save the JSON file as backup

**To Import:**
1. Go to **Settings** tab
2. Click **"Import Data"**
3. Select your JSON backup file
4. Confirm to overwrite existing data

## 🎨 Design Features

### Solarized Color Palette
- Light mode: Warm, comfortable reading
- Dark mode: Easy on the eyes, perfect for night sessions
- Smooth transitions between themes

### Typography
- Display font: DM Serif Display (elegant headings)
- Body font: Inter (clean, readable)

### Animations
- Floating logo animation
- Smooth circular progress
- Fade-in transitions between tabs
- Hover effects on buttons and cards
- Pulse animation on timer icon

### Visual Elements
- Soft gradient backgrounds
- Circular progress with gradient stroke
- Rounded corners and soft shadows
- Icon-based navigation
- Color-coded categories

## 💾 Data Storage

All data is stored securely in Supabase with Row Level Security (RLS):

- **Categories**: Your custom focus categories
- **Sessions**: Completed focus sessions with timestamps
- **Settings**: Your preferences

Data is automatically synced across devices when you log in with the same account.

## 🔒 Privacy & Security

- All data is private to your account (RLS enabled)
- Only you can see and modify your focus data
- Data is encrypted in transit and at rest
- No data sharing or third-party analytics

## 🛠️ Customization Ideas

### Add New Features
- Break timer functionality
- Pomodoro technique integration
- Goal setting and tracking
- Custom sound selections
- Desktop notifications
- Weekly/monthly reports

### Styling Tweaks
- Change color schemes
- Add custom fonts
- Modify animations
- Adjust layout for mobile
- Create new category icons

### Data Analysis
- Add more chart types
- Create productivity insights
- Compare periods
- Set focus goals
- Track focus quality

## 🐛 Troubleshooting

### Timer doesn't start
- Check browser console for errors
- Verify Supabase connection
- Ensure you're logged in
- Try refreshing the page

### Data not syncing
- Check internet connection
- Verify Supabase status
- Check browser console for errors
- Try logging out and back in

### Can't create categories
- Ensure category name is unique
- Check that all fields are filled
- Verify database permissions in Supabase

### Export/Import issues
- Ensure JSON file is valid
- Check file size isn't too large
- Verify data structure matches expected format

## 📊 Database Schema

### focus_categories
```
id              TEXT PRIMARY KEY
user_id         UUID (references auth.users)
name            TEXT
icon            TEXT (emoji)
color           TEXT (hex color)
created_at      TIMESTAMP
```

### focus_sessions
```
id                TEXT PRIMARY KEY
user_id           UUID (references auth.users)
category          TEXT
duration_minutes  INTEGER
start_time        TIMESTAMP
end_time          TIMESTAMP
date              TEXT (YYYY-MM-DD)
created_at        TIMESTAMP
```

### focus_settings
```
user_id      UUID PRIMARY KEY (references auth.users)
settings     JSONB
updated_at   TIMESTAMP
```

## 🎯 Best Practices

1. **Set realistic durations**: Start with 15-25 minute sessions
2. **Use specific categories**: "Math Homework" instead of just "Study"
3. **Review analytics weekly**: Check your patterns and adjust
4. **Regular breaks**: Use the break duration setting
5. **Export data monthly**: Keep backups of your focus history

## 🔮 Future Enhancements

Potential features to add:
- [ ] Break timer integration
- [ ] Desktop notifications
- [ ] Weekly email summaries
- [ ] Focus quality ratings
- [ ] Integration with calendar
- [ ] Team/shared sessions
- [ ] Mobile app version
- [ ] Spotify integration for focus music
- [ ] Task tagging within sessions

## 📝 Credits

- **Solarized** color palette by Ethan Schoonover
- **Supabase** for backend infrastructure
- **DM Serif Display** & **Inter** fonts from Google Fonts
- Part of the **451-Solarized** project

## 📧 Support

For issues or questions:
- Email: okamotoshoei451@gmail.com
- GitHub: Create an issue in the repository

---

**Happy Focusing! 🎯**

Remember: The best productivity system is the one you actually use. Start simple, track consistently, and watch your focus time grow!
