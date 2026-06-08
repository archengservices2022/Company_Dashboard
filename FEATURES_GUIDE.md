# Company Dashboard - Features Guide

Complete guide to all features available in the Admin and Employee portals.

---

## 🔐 LOGIN PAGE

### Features
- Clean, professional login interface
- Email and password input fields
- Error message display
- Demo credentials hint
- Responsive design
- Loading state during authentication

### How to Use
1. Enter email address
2. Enter password
3. Click "Login" button
4. System validates credentials with Firebase
5. Redirects to dashboard based on role

### Demo Credentials
```
Admin: admin@company.com / Admin@123
Employee: employee@company.com / Employee@123
```

---

## 👨‍💼 ADMIN DASHBOARD

### Overview
Complete management system for company operations. All data is securely stored in Firestore and only accessible to authenticated admin users.

---

### 1️⃣ EMPLOYEE MANAGEMENT

#### Add Employees
**Purpose**: Create new employee records

**Fields**:
- Full Name (required)
- Email Address (required)
- Department
- Position/Job Title
- Monthly Salary
- Join Date
- Employment Status (Active/Inactive)

**How to Use**:
1. Click "Add Employee" button
2. Fill in the form fields
3. Click "Add Employee" to save
4. Employee appears in the table below

**Features**:
- Form validation
- Clear input fields after save
- Cancel button to exit form
- Immediate table refresh

#### View Employees
**Table Columns**:
- Name
- Email
- Department
- Position
- Monthly Salary
- Status (Active/Inactive)
- Actions (Edit/Delete)

**Features**:
- Sortable/searchable records
- Color-coded status (green=active, red=inactive)
- Quick actions

#### Edit Employees
1. Click the Edit icon (pencil) next to employee
2. Form populates with current data
3. Modify fields as needed
4. Click "Update Employee" to save

#### Delete Employees
1. Click the Delete icon (trash) next to employee
2. Confirm deletion in popup
3. Employee record is removed

**Data Stored**:
```json
{
  "name": "Employee Name",
  "email": "employee@company.com",
  "department": "Engineering",
  "position": "Senior Developer",
  "salary": "5000",
  "joinDate": "2023-01-15",
  "status": "active",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

### 2️⃣ HOLIDAY MANAGEMENT

#### Create Holidays
**Purpose**: Define company-wide holidays and time-offs

**Fields**:
- Holiday Name (required) - e.g., "New Year", "Christmas"
- Holiday Date (required)
- Holiday Type (National/Company/Regional)
- Description/Notes

**How to Use**:
1. Click "Add Holiday" button
2. Enter holiday details
3. Select holiday type
4. Add description (optional)
5. Click "Add Holiday"

#### Holiday Types
- **National**: Official public holidays
- **Company**: Company-specific holidays
- **Regional**: Region-specific holidays

#### View Holidays
Holidays displayed as cards showing:
- Holiday name and date
- Full date with day name
- Description
- Holiday type badge (color-coded)

#### Features
- Chronologically sorted (upcoming first)
- Responsive card layout
- Delete functionality
- Type-based color coding

**Data Stored**:
```json
{
  "name": "Holiday Name",
  "date": "2024-01-01",
  "description": "Holiday description",
  "type": "national",
  "companyId": "default",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

### 3️⃣ TASK MANAGEMENT

#### Assign Tasks
**Purpose**: Create and assign work tasks to employees

**Fields**:
- Task Title (required)
- Task Description
- Assign To (required) - Select from employee list
- Due Date (required)
- Priority Level (Low/Medium/High)
- Task Status (Pending/In Progress/Completed)

**How to Use**:
1. Click "Assign Task" button
2. Enter task details
3. Select employee from dropdown
4. Set due date and priority
5. Click "Assign Task"

#### Priority Levels
- **High Priority**: Urgent tasks (RED)
- **Medium Priority**: Standard tasks (YELLOW)
- **Low Priority**: Non-urgent tasks (GREEN)

#### Task Status
- **Pending**: Not yet started
- **In Progress**: Currently being worked on
- **Completed**: Finished tasks

#### View Tasks
Tasks displayed as cards showing:
- Task title
- Assigned employee name
- Task description
- Priority and status badges
- Due date
- Edit/Delete options

#### Features
- Priority-based color coding
- Status filtering available
- Edit existing tasks
- Delete tasks
- Due date tracking

**Data Stored**:
```json
{
  "title": "Task Title",
  "description": "Task description",
  "assignedTo": "employee_id",
  "dueDate": "2024-12-31",
  "priority": "high",
  "status": "pending",
  "companyId": "default",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

### 4️⃣ FINANCE & P&L MANAGEMENT

#### Key Metrics
Three main dashboards showing:

1. **Total Payroll** (Blue card)
   - Total monthly salary expense
   - Monthly cost indicator

2. **Active Employees** (Green card)
   - Number of currently employed staff
   - Employment count

3. **Average Salary** (Purple card)
   - Mean salary per employee
   - Cost per person

#### Employee Salary Details Table
**Columns**:
- Employee Name
- Position/Job Title
- Department
- Monthly Salary
- Annual Salary (calculated as salary × 12)

**Features**:
- Sorted by salary (highest to lowest)
- Currency formatted ($)
- Quick salary calculations

#### Financial Summary Section
Shows key financial metrics:
- Total Monthly Payroll
- Total Annual Payroll (monthly × 12)
- Average Employee Cost
- Department-wise breakdown reference

**Data Insights**:
```
Total Monthly Payroll = Sum of all employee salaries
Total Annual Payroll = Monthly Payroll × 12
Average Employee Cost = Total Payroll ÷ Active Employees
Cost per Department = Sum of salaries in that department
```

**Example Report**:
```
Total Monthly Payroll: $50,000
Active Employees: 10
Average Cost per Employee: $5,000
Total Annual Payroll: $600,000
```

---

## 👤 EMPLOYEE DASHBOARD

### Overview
Personal workspace where employees can view their information, tasks, attendance, and salary details.

---

### 1️⃣ HOLIDAYS VIEW

#### Features
- View all company holidays
- Separated into two sections:
  - **Upcoming Holidays** (GREEN - Future dates)
  - **Past Holidays** (GRAY - Past dates)

#### Holiday Card Information
- Holiday name
- Full date with day name (e.g., Monday, January 1, 2024)
- Description/notes
- Holiday type badge

#### Color Coding
- Upcoming: Green border, green background
- Past: Gray border, gray background
- Holiday types: Different badge colors

**Use Case**: Employees can plan their schedule around company holidays

---

### 2️⃣ TASKS VIEW

#### Task Organization
Tasks are organized into three sections:

1. **Pending Tasks** (RED)
   - Tasks assigned but not started
   - Icon: Alert icon
   - Shows all information needed to start

2. **In Progress** (YELLOW)
   - Tasks currently being worked on
   - Icon: Clipboard icon
   - Shows progress status

3. **Completed** (GREEN)
   - Finished tasks
   - Icon: Check mark
   - Historical reference

#### Task Card Details
Each task shows:
- Task title
- Full description
- Priority level (color-coded)
- Due date
- Status badge

#### Priority Colors
- High Priority: RED
- Medium Priority: YELLOW
- Low Priority: GREEN

**Use Case**: Stay on top of assigned work and track progress

---

### 3️⃣ ATTENDANCE TRACKING

#### Dashboard Summary (Top 3 Cards)

**Card 1 - Current Month**
- Shows month and year
- Total working days

**Card 2 - Present Days**
- Count of days marked present
- Green highlight

**Card 3 - Attendance Rate**
- Percentage of days present
- Calculated as: (Present Days ÷ Total Days) × 100

**Example**:
```
Current Month: June 2024
Present Days: 18
Attendance Rate: 90%
(18 out of 20 working days)
```

#### Attendance Records Table
**Columns**:
- Date (MM/DD/YYYY format)
- Day of week (Mon, Tue, etc.)
- Status (Present/Absent)
- Check In Time
- Check Out Time

**Status Badge Colors**:
- Present: GREEN with checkmark
- Absent: RED with alert icon
- Leave: YELLOW

**Features**:
- Most recent 20 records displayed
- Hover effects for row selection
- Time-based check in/out tracking

**Data Example**:
```
Date: Jun 08, 2024
Day: Friday
Status: Present
Check In: 09:00 AM
Check Out: 06:00 PM
```

**Use Case**: Keep track of attendance history and know your attendance percentage

---

### 4️⃣ SALARY & ANNOUNCEMENTS

#### Salary Information Section

**Salary Overview Card** (Blue gradient)
Shows three key pieces of information:

1. **Monthly Salary**
   - Current monthly compensation
   - Formatted with currency

2. **Annual Salary**
   - Calculated as monthly salary × 12
   - Projected yearly income

3. **Current Position**
   - Job title/position name
   - Department role

**Example**:
```
Monthly Salary: $5,000
Annual Salary: $60,000
Position: Senior Developer
```

#### Salary Slips

**What are Salary Slips?**
Official monthly payroll documents showing:
- Month and year issued
- Basic salary
- Deductions
- Net salary (Take-home pay)

**Salary Slip Details**:
- Issue date (month/year)
- Basic salary amount
- Deductions amount
- Net salary (final amount)
- Download button for PDF

**Calculation**:
```
Net Salary = Basic Salary - Deductions
Example: $5,000 - $200 = $4,800 (take-home)
```

**Features**:
- Multiple salary slips stored historically
- Download as PDF
- Clear breakdown of earnings
- Deduction transparency

#### Company Announcements

**Features**:
- Latest announcements listed first
- Color-coded (Blue border left side)
- Organized by category

**Announcement Details**:
- Title (Main heading)
- Content/Body text
- Category (HR/Finance/Company/General)
- Date published

**Example Announcements**:
```
1. New Office Hours Starting July
   Category: Company
   Date: June 5, 2024

2. Q3 Performance Reviews Scheduled
   Category: HR
   Date: June 1, 2024
```

**Use Case**: Stay informed about company updates, policy changes, and announcements

---

## 🔄 Navigation & Layout

### Common Elements

#### Header Bar (appears on all pages)
- Dashboard title
- User info (email and role)
- Logout button
- Auto-logout on session timeout

#### Tab Navigation
- 4 main tabs at top of dashboard
- Visual indication of active tab
- Click to switch sections

#### Loading States
- Spinner appears while loading data
- Prevents clicking while loading
- Clear loading feedback

---

## 🔐 Permission & Access Control

### Admin Only Access
- Employee Management
- Holiday Management
- Task Assignment
- Finance Reports

### Employee Only Access
- Personal task list
- Own attendance records
- Own salary information
- Holiday calendar (read-only)

### Shared Access
- Can view company-wide holidays
- Can read company announcements

### Role Verification
- Automatic role check on login
- Prevents unauthorized access
- Redirects based on permissions

---

## 🎨 UI/UX Features

### Colors & Styling
- **Blue**: Primary brand color, important actions
- **Green**: Success, positive status
- **Red**: Danger, warnings, high priority
- **Yellow**: Caution, medium priority
- **Gray**: Secondary, inactive

### Interactive Elements
- Buttons with hover effects
- Clickable tables with row highlighting
- Form fields with focus states
- Responsive modals and popups

### Accessibility
- Clear color contrast
- Readable font sizes
- Clear action buttons
- Error message displays
- Loading indicators

---

## 📊 Data Examples

### Employee Record Example
```json
{
  "name": "Raj Kumar",
  "email": "raj.kumar@company.com",
  "department": "Engineering",
  "position": "Senior Developer",
  "salary": "6000",
  "joinDate": "2023-01-15",
  "status": "active"
}
```

### Task Example
```json
{
  "title": "API Development",
  "description": "Build REST API for employee management",
  "assignedTo": "employee_id_123",
  "dueDate": "2024-12-31",
  "priority": "high",
  "status": "in-progress"
}
```

### Attendance Example
```json
{
  "employeeId": "emp_123",
  "date": "2024-06-08",
  "status": "present",
  "checkIn": "09:00",
  "checkOut": "18:00"
}
```

---

## 🚀 Tips & Best Practices

### For Admins
1. Keep employee records up to date
2. Plan holidays in advance
3. Assign tasks with clear descriptions
4. Review finance reports monthly
5. Archive/delete old records periodically

### For Employees
1. Check tasks regularly
2. Update task status as you progress
3. Review announcements for updates
4. Keep salary slip copies
5. Report attendance discrepancies

---

## ⚙️ System Performance

- **Page Load**: < 2 seconds
- **Data Operations**: Real-time sync with Firestore
- **Search**: Instant table filtering
- **File Download**: Immediate salary slip generation
- **Responsive**: Works on all device sizes

---

## 🆘 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Data not showing | Refresh page, check internet connection |
| Can't add employee | Verify all required fields filled |
| Permission denied | Check your role, logout and login again |
| Salary slip not available | Contact admin to generate slip |
| Task not visible | Check assignment and filters |

---

## 📚 Related Documentation

- [README.md](./README.md) - Project overview
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Database setup
- [SETUP_SUMMARY.md](./SETUP_SUMMARY.md) - Quick start guide

---

**Last Updated**: June 2026
**Version**: 1.0.0
