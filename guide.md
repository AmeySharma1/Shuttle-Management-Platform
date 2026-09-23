# CampusRide Website Testing Guide

This guide explains how to test CampusRide as a normal website user. You do not need to know how the code works.

## 1. Start the Website

1. Open a terminal in the project root folder.
2. Run:

   ```bash
   npm run dev
   ```

3. Open the local address shown in the terminal.
   - Usually: `http://localhost:3000`
   - If port 3000 is already being used, Next.js may use `http://localhost:3001`.
4. Open the address in your browser.

The first screen is the CampusRide welcome page.

## 2. Understand the Welcome Page

The welcome page has three role choices:

- **Commuter**: Books shuttle rides and views personal trips.
- **Admin**: Manages bookings, drivers and routes.
- **Driver**: Manages duty status and assigned trips.

Choose one role by clicking its **Continue as ...** button.

The selected role is saved in the browser. If you refresh the page, you normally stay in that role.

In a Commuter workspace, use the **Select commuter** dropdown in the header to test Aarav Mehta, Priya Iyer, or Rohan Das. In a Driver workspace, use **Select driver** to test Rajesh Kumar, Sunil Patil, or Pradeep Singh. The selected identity controls which bookings or driver trips you see.

To leave the current role, use **Leave workspace** in the desktop sidebar. You can also use the **Switch role** dropdown in the top header.

## 3. Test the Commuter Flow

### 3.1 Enter the Commuter Area

1. Return to the welcome page if necessary.
2. Click **Continue as Commuter**.
3. You are taken to **Book a ride**.
4. The header shows the commuter account, usually **Aarav Mehta**.
5. On desktop, commuter links appear in the sidebar.
6. On mobile, commuter links appear at the bottom of the screen.

The commuter account is a demo user. It represents the person booking a ride.

### 3.2 Book a Ride

1. On **Book a ride**, choose a **Pickup stop**.
2. Choose a **Drop stop**.
   - The selected pickup stop is removed from the drop-stop list.
3. Use **Swap** to exchange the pickup and drop stops.
4. Choose a date.
   - Today and future dates are allowed.
   - Past dates cannot be selected.
5. Choose a time.
   - A time that has already passed today is rejected.
6. Choose the number of passengers from 1 to 4.
7. Click **Book ride**.

Try the validation before making a successful booking:

- Leave the pickup stop empty.
- Leave the drop stop empty.
- Try to use the same stop for both fields.
- Leave date or time empty.
- Try a past date or past time.
- Enter fewer than 1 or more than 4 passengers.

Each invalid field should show a small error below that field. The booking form keeps your entered values when the service rejects the booking.

### 3.3 Check the Booking Confirmation

After a successful booking, the form changes into a confirmation card. Check that it shows:

- Booking ID
- Booking status
- Pickup and drop stops
- Date and time
- Driver and vehicle if a driver was assigned
- A message saying **We are finding a driver for you** when no driver is assigned

Use the buttons on the confirmation card:

- **Book another ride** returns to a fresh booking form.
- **View my trips** opens the commuter trip list.

### 3.4 Test My Trips

1. Open **My trips** from the sidebar or mobile navigation.
2. You will see two tabs:
   - **Upcoming**: Requested, Accepted, Waiting and On Going trips for today or later.
   - **Past**: Completed, Cancelled, No Show, Declined and older trips.
3. Upcoming trips are shown from soonest to latest.
4. Past trips are shown from newest to oldest.

Each trip card can show:

- Status
- Pickup and drop stops
- Date and 12-hour time
- Passenger count
- Assigned driver, phone number and vehicle plate
- **Driver not assigned yet** when there is no driver

### 3.5 Edit a Trip

1. Find an upcoming trip.
2. Click **Edit**.
3. Change the pickup stop, drop stop, date or time.
4. Click **Save changes**.
5. Check the success toast.
6. Confirm that the trip card shows the new values.

Editing is allowed only for Requested, Accepted and Waiting trips. Completed, Cancelled, No Show, Declined and On Going trips explain why editing is unavailable.

### 3.6 Cancel a Trip

1. Find an upcoming trip that can be cancelled.
2. Click **Cancel trip**.
3. A confirmation dialog appears.
4. Confirm the cancellation.
5. Check the success toast.
6. Open the **Past** tab.
7. Confirm that the trip now appears as **Cancelled**.

A trip that is already in progress or in a final state cannot be cancelled. The card shows the reason instead of allowing the action.

## 4. Test the Admin Flow

### 4.1 Enter the Admin Area

1. Use the **Switch role** dropdown in the header.
2. Choose **Admin**.
3. The app takes you to `/admin`.
4. The header title should say **Overview**.
5. The admin demo account is usually **Admin User**.

Admin navigation contains:

- Overview
- Bookings
- Drivers
- Routes

### 4.2 Test the Admin Overview

The Overview page shows four numbers for today:

- **Today’s bookings**: All bookings scheduled for today.
- **Active drivers**: Drivers currently on duty.
- **Completed trips**: Today’s completed bookings.
- **No-shows**: Today’s bookings marked as No Show.

Below the numbers is the **Bookings by hour** chart.

1. Check the hour labels from 6 AM to 10 PM.
2. Check that each bar shows a booking count.
3. Find the tallest highlighted bar.
4. Read the sentence below the chart, such as **Busiest hour: 9 AM (6 bookings)**.
5. On a narrow screen, scroll inside the chart area horizontally if needed.

The **Needs attention** section lists up to five Requested bookings that do not have a driver.

- Each item shows the rider, route and time.
- Click **View** to open the bookings area.
- If there are none, the page says **All bookings have a driver.**

### 4.3 Test Admin Bookings

1. Open **Bookings** in the admin navigation.
2. Check the table columns:
   - Booking ID
   - Rider
   - Route
   - Date and time
   - Driver
   - Status
3. On mobile, the table becomes stacked booking cards.
4. Check that an unassigned driver appears as **Not assigned** in muted text.

Test the filters:

1. Search for a rider name, such as `Aarav`.
2. Search for a booking ID, such as `BK-1001`.
3. Choose a status from the status dropdown.
4. Select a date.
5. Combine search, status and date filters.
6. Click **Clear** to remove all filters.
7. Confirm that filtering returns to page 1.

Test sorting:

1. Click a sortable column heading.
2. Confirm that an arrow appears.
3. Click it again to reverse ascending and descending order.

Test pagination:

1. Check the page text and total booking count.
2. Click **Next**.
3. Click **Previous**.
4. Apply a filter and confirm the page returns to page 1.

### 4.4 Test the Booking Detail Drawer

1. Click a booking row or booking card.
2. A detail drawer opens.
3. Check that it shows:
   - Booking ID
   - Status
   - Rider name and phone
   - Route
   - Date and time
   - Passenger count
   - Driver and vehicle
   - A simple status history

Depending on the booking status, test these actions:

To assign a driver to a requested booking:

1. Open the requested booking from the table.
2. Click **Assign driver** in the booking drawer.
3. Choose Rajesh Kumar, Sunil Patil, or another driver.
4. Click **Assign driver** in the modal.
5. The booking changes from Requested to Accepted.
6. The commuter trip shows the assigned driver and vehicle.
7. The assigned driver sees the trip in **My day** when the booking is for today.

- **Edit**: Opens the booking edit form.
- **Cancel booking**: Opens a confirmation dialog.
- **Sign in rider**: Changes an Accepted or Waiting booking to On Going.
- **Mark no-show**: Opens a confirmation dialog for an Accepted or Waiting booking.

Every action should show a loading state and then a success or error toast. The table and drawer refresh after a successful change.

Try opening a Completed or Cancelled booking too. Its unavailable actions should be disabled and show a plain-English explanation.

## 5. Test the Admin Driver Timeline

1. Open **Drivers** in the admin navigation.
2. Each driver row shows:
   - Driver name
   - Vehicle plate
   - Duty status
   - A timeline from 6 AM to 10 PM
3. The timeline legend explains:
   - Blue: Shift
   - Amber: Break
   - Violet: Trip
   - Red line: Current time
4. Trips appear in their own lower lane below the shift and break lane.
5. On mobile, scroll inside the timeline area instead of scrolling the whole page sideways.

Test the date controls:

- Use the date picker.
- Use **Previous day**.
- Use **Next day**.
- The red current-time line appears only when viewing today.

Test driver search:

1. Type a driver name, such as `Rajesh`.
2. Confirm that only matching drivers remain.
3. Search for a name that does not exist.
4. Confirm the **No drivers found** empty state.

### 5.1 Test Driver Timeline Actions

Open the three-dot menu on a driver row.

- **Start duty**: Starts a driver shift when the driver is off duty.
- **End duty**: Ends an active duty shift.
- **Take break**: Changes an on-duty driver to on-break.
- **End break**: Returns an on-break driver to on-duty.
- **Add break**: Opens a form to add a scheduled break.

Disabled menu actions show a reason in their tooltip. Every successful action refreshes the timeline and shows a toast.

### 5.2 Test Add Break

1. Make sure the driver is on duty.
2. Open the three-dot menu.
3. Click **Add break**.
4. Enter a start and end time.
5. Try invalid values:
   - Missing start or end time
   - End time before start time
   - Break outside the duty shift
   - Break overlapping another break
   - Break overlapping a trip
6. Confirm that an inline error or service error explains the problem.
7. Enter a valid break and click **Add break**.
8. Confirm that the amber block appears in the driver timeline.

## 6. Test the Driver Flow

### 6.1 Enter Driver My Day

1. Use the top **Switch role** dropdown.
2. Choose **Driver**.
3. The app opens `/driver`.
4. The demo driver is usually **Rajesh Kumar**.
5. The header title should say **My day**.

The top card shows:

- Driver name
- Vehicle model
- Vehicle plate
- Current duty status

### 6.2 Test Duty Controls

The available buttons depend on the current status:

- **Start duty** appears when the driver is off duty.
- **End duty** appears while the driver is on duty or on a break.
- **Take break** appears while the driver is on duty.
- **End break** appears while the driver is on a break.

For each action:

1. Click the button.
2. Confirm it shows a loading state.
3. Confirm a success or error toast appears.
4. Confirm the duty status changes after refresh.

The same duty status should be visible on the Admin Driver Timeline after refreshing that page.

### 6.3 Test Driver Trips

The **Today’s trips** section lists trips assigned to the current driver.

Each trip shows:

- Time
- Rider name and phone
- Route
- Passenger count
- Status

Use the trip actions:

- **Start trip** changes an Accepted or Waiting trip to On Going.
- **Complete trip** changes an On Going trip to Completed.

A driver normally needs to be on duty before working with trips. Disabled buttons explain what must happen first.

After starting or completing a trip:

1. Check the success toast.
2. Refresh My Day.
3. Switch to Admin.
4. Open Driver Timeline or Bookings.
5. Confirm the changed status appears there too.

## 7. Test Role Guards

Role guards prevent the wrong user from using another role’s pages.

1. Choose Commuter.
2. Manually open `/admin` in the address bar.
3. Confirm the page says **This page is for admins**.
4. Use **Switch role** or **Go to my home**.
5. Repeat with `/driver` and another role.

If no role is selected, role pages redirect back to the welcome page.

## 8. Test Theme and Responsive Layout

### Light and Dark Themes

1. Open any page after choosing a role.
2. Click the sun/moon theme button in the header.
3. Check the page in light mode.
4. Click it again and check dark mode.
5. Confirm that text, cards, inputs, modals and badges remain readable.

### Mobile Width

Use browser responsive mode or resize the browser to a narrow width.

Check that:

- The desktop sidebar is replaced by bottom navigation.
- Forms use one column.
- Cards stack vertically.
- Tables become cards.
- Modals and drawers fit the screen.
- The driver timeline scrolls inside its own area.
- The entire page does not scroll sideways.
- Buttons remain easy to tap.

## 9. Suggested Complete Demo Order

For the smoothest demonstration, follow this order:

1. Start on the welcome page.
2. Choose **Commuter**.
3. Book a ride for today or tomorrow.
4. Open **My trips** and show the new booking.
5. Edit the booking.
6. Switch to **Admin**.
7. Open **Overview** and show the numbers, chart and Needs attention list.
8. Open **Bookings** and find the commuter booking by rider name or booking ID.
9. Open the booking drawer and show its details.
10. Open **Drivers** and show the driver timeline.
11. Start duty or add a valid break where appropriate.
12. Switch to **Driver**.
13. Open **My day** and show the driver status and assigned trips.
14. Start and complete an allowed trip.
15. Switch back to **Admin** and confirm that the booking status changed.
16. Open **Routes**.
17. Add a route with at least two stops.
18. Edit the route order.
19. Assign a driver.
20. Toggle the route active or inactive.
21. Repeat a few pages in light theme and mobile width.

## 10. Important Demo Notes

- Data is stored in the browser, so changes can remain after refreshing.
- The selected role is also stored in the browser.
- If a page looks different because of earlier testing, switch roles using the header dropdown or clear the site data in the browser and start again.
- Some actions are intentionally blocked by the booking and driver rules. A disabled button or friendly message is expected behavior.
- The design preview page exists at `/design-preview` for development reference, but it is not linked from the normal website.
