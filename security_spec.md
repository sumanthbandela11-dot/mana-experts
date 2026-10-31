# Mana Experts — Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **No Self-Assigned Admin Role**: A user creating `/users/{userId}` can only choose `"CUSTOMER"` or `"TECHNICIAN"`, unless `isAdmin()` is true.
2. **PII Split Isolation**: Customer email, phone, and exact street address are stored in `/users/{userId}/private/contact` and `/bookings/{bookingId}/private/details`. Neither is readable by unassigned technicians or general signed-in users.
3. **Protected Booking Address Reveal**: `/bookings/{bookingId}/private/details` can only be read by:
   - The booking's `customerId`
   - A verified `isAdmin()`
   - The booking's assigned `technicianId` when the parent `/bookings/{bookingId}` document has `status` in `['ACCEPTED', 'IN_PROGRESS', 'WORK_COMPLETED', 'CONFIRMED']`.
4. **Pending Approval on Technician Registration**: When a technician creates `/technicians/{techId}`, `approvalStatus` MUST be `'PENDING'`, `coinBalance` MUST be `0`, `totalEarnings` MUST be `0`, and `completedJobs` MUST be `0`. Only `isAdmin()` can transition `approvalStatus` to `'APPROVED'` and grant initial trial coins.
5. **Atomic Single-Technician Acceptance & Coin Debit**: A booking in `'PENDING'` state with `technicianId == ''` can transition to `'ACCEPTED'` only when `technicianId == request.auth.uid`, the technician is `'APPROVED'`, and `coinBalance` is atomically decremented by 1 (`getAfter` invariant).
6. **Terminal State Locking**: Once a booking reaches `'CONFIRMED'` or `'CANCELLED'`, only `rated` (from `false` to `true` by the customer) or an `isAdmin()` override can modify it.

## 2. The "Dirty Dozen" Payloads

1. **Privilege Escalation on Registration**: User attempts to create `/users/uid1` with `role: "ADMIN"`. -> `PERMISSION_DENIED`
2. **Technician Self-Approval**: Technician creates `/technicians/uid1` with `approvalStatus: "APPROVED"` and `coinBalance: 999`. -> `PERMISSION_DENIED`
3. **Technician Coin Manipulation**: Technician updates `/technicians/uid1` changing `coinBalance` from `2` to `50`. -> `PERMISSION_DENIED`
4. **Technician Earnings Fabrication**: Technician updates `/technicians/uid1` changing `totalEarnings` from `0` to `10000`. -> `PERMISSION_DENIED`
5. **Unassigned Technician PII Scraping**: Technician `tech2` attempts `get(/bookings/b1/private/details)` while `b1.status == 'PENDING'`. -> `PERMISSION_DENIED`
6. **Duplicate Booking Hijack**: Technician `tech2` attempts to update `/bookings/b1` to `technicianId: "tech2"` when `b1.status == 'ACCEPTED'` and `b1.technicianId == "tech1"`. -> `PERMISSION_DENIED`
7. **Free Job Acceptance (Bypassing Coin Debit)**: Technician accepts `/bookings/b1` without atomically decrementing `/technicians/tech1.coinBalance` by 1. -> `PERMISSION_DENIED`
8. **Shadow Field Injection**: Customer updates `/bookings/b1` with an extra key `isPriorityHack: true`. -> `PERMISSION_DENIED`
9. **Spoofed Admin Email (Unverified)**: Attacker with `email == 'sumanth.bandela11@gmail.com'` and `email_verified == false` attempts to approve a technician. -> `PERMISSION_DENIED`
10. **Terminal Booking Mutation**: Technician attempts to change `labourCharges` on a booking whose `status` is already `'CONFIRMED'`. -> `PERMISSION_DENIED`
11. **ID Poisoning / Oversized Payload**: Attacker sends a 5KB string into `problemDescription` (limit 500 chars). -> `PERMISSION_DENIED`
12. **Cross-User Notification Read**: User `uid1` runs an unconstrained `list` query on `/notifications` without filtering `recipientId == request.auth.uid`. -> `PERMISSION_DENIED`
