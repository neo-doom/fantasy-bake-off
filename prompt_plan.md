# Fantasy Bakes - GBBO Fantasy League Website Specification

## Project Overview
Create a web application for managing a Great British Bake Off fantasy league where friends draft bakers and score points based on their weekly performance throughout the season.

## Core Requirements

### League Structure
- **Teams**: 4-6 teams per league
- **Bakers per team**: 
  - 4 teams = 3 bakers each
  - 6 teams = 2 bakers each
- **Total contestants**: 12 bakers per season
- **Assignment**: Manual (handled outside the app or through admin interface)

### Scoring System
| Event | Points |
|-------|--------|
| Survives the week | +1 |
| Wins technical challenge | +2 |
| Star Baker | +3 |
| Hollywood Handshake | +3 |
| Season Winner | +10 |
| Soggy Bottom | -0.5 |
| **Manual Override** | Variable (admin can adjust) |

### User Access Structure
1. **Public View** (/)
   - View team standings
   - See weekly scores
   - Check historical data
   - No editing capabilities

2. **Admin View** (/admin)
   - Password protected
   - Enter/edit weekly scores
   - Manage teams and bakers
   - Advance weeks
   - Add notes/commentary

## Feature Specifications

### Admin Features

#### Authentication
- Special URL path `/admin`
- Single password protection
- Session-based authentication

#### Team & Baker Management
- Add/edit team names via web interface
- Assign bakers to teams
- Upload JSON configuration file
- Export current configuration

#### Weekly Scoring Interface
- Grid view with all active bakers
- Checkboxes for each scoring criterion
- Manual point override field per baker
- Save week's scores
- Edit previous weeks

#### Season Management
- Manually advance to next week
- Mark eliminated bakers
- Add weekly notes/commentary
- End season and declare winner

### Public Features

#### Main Dashboard
- Current standings leaderboard
- Total points per team
- Current week indicator
- Last updated timestamp

#### Weekly Breakdown View
- Points earned by each baker this week
- Which criteria each baker met
- Eliminated bakers shown as grayed out
- Weekly notes from admin

#### Historical View
- Browse all previous weeks
- See progression of scores
- Track position changes

#### Statistics & Charts
- Line graph of team scores over time
- Individual baker performance
- Season statistics

#### Season Finale
- Champion celebration banner
- Final statistics:
  - Most handshakes
  - Highest single-week score
  - Best individual baker
- Archive completed season
- Export final results

## Technical Specifications

### Data Storage
- JSON file database structure
- Separate files for:
  - League configuration
  - Weekly scores
  - Season archives

### Sample Data Structure
```json
{
  "season": {
    "name": "Season 2024",
    "currentWeek": 1,
    "teams": [
      {
        "id": "team1",
        "name": "Soggy Bottoms",
        "bakers": ["baker1", "baker2", "baker3"]
      }
    ],
    "bakers": [
      {
        "id": "baker1",
        "name": "John Smith",
        "eliminated": false,
        "eliminatedWeek": null
      }
    ],
    "weeks": [
      {
        "weekNumber": 1,
        "scores": {
          "baker1": {
            "survived": true,
            "technicalWin": false,
            "starBaker": false,
            "handshake": true,
            "soggyBottom": false,
            "manualAdjustment": 0,
            "total": 4
          }
        },
        "notes": "Exciting first week!"
      }
    ]
  }
}
```

## Design Specifications

### Visual Style
- **Color Scheme**: GBBO-inspired pastels
  - Soft pink (#FFB6C1)
  - Mint green (#98D8C8)
  - Cream (#FFF8DC)
  - Light blue (#B6D7FF)
  - Lavender (#E6E6FA)

- **Typography**: Clean, readable fonts with playful headers
- **Style**: Fun and themed like the show
- **Imagery**: 1-2 GBBO images (tent, baking icons)
- **Overall**: Clean and simple with good data presentation

### Responsive Design
- **Desktop**: Full-featured grid layouts
- **Mobile (Public only)**: 
  - Vertical card layout
  - Stacked information
  - Touch-friendly buttons
- **Admin**: Desktop-only (no mobile optimization needed)

## Additional Features

### Notifications & Updates
- "Last updated" timestamp
- Position change indicators (↑↓)
- Weekly notes/commentary section
- Highlight recent changes

### End of Season
- Champion celebration page
- Season statistics compilation
- Archive system for past seasons
- Export to CSV/JSON

## Development Priorities

### Phase 1 (MVP)
1. Basic admin authentication
2. Team/baker setup
3. Weekly scoring grid
4. Public leaderboard
5. JSON data storage

### Phase 2 (Enhanced)
1. Historical views
2. Charts and graphs
3. Mobile responsive public view
4. Import/export functionality

### Phase 3 (Polish)
1. Season finale features
2. Statistics dashboard
3. Archive system
4. UI/UX refinements

## Technology Stack Recommendations
- Frontend: React or Vue.js for interactivity
- Styling: Tailwind CSS or custom CSS with GBBO theme
- Charts: Chart.js or D3.js for visualizations
- Storage: JSON files with Node.js backend or browser LocalStorage for simpler implementation
- Hosting: Vercel, Netlify, or GitHub Pages

## Success Criteria
- Admin can easily enter scores each week
- League members can check standings on any device
- Historical data is preserved and browsable
- The experience feels fun and connected to GBBO
- Data is persistent and can be backed up

## Notes for Implementation
- Keep the scoring grid simple and quick to use
- Ensure data validation to prevent scoring errors
- Make the public view engaging with visual feedback
- Consider adding fun animations for big moments (Star Baker, eliminations)
- Test thoroughly with sample data before the season starts
- Add items to the todo.md file and check them off as they are completed