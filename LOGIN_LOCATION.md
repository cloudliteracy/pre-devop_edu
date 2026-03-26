# Admin Location-Based Access Control

This document outlines the secure location-based authentication system implemented for CloudLiteracy administrators.

## Overview

The system enforces strict geographical restrictions on administrative logins. Every administrator is assigned an "Authorized Country." During the login process, the system performs a real-time geolocation check based on the user's IP address. If the detected country does not match the authorized setting, access is denied.

## Key Features

- **Centralized Management**: Super Admins can manage all administrator locations from a dedicated "Admins Location" tab in the dashboard.
- **Real-Time Geolocation**: Uses `geoip-lite` to perform high-speed, local lookups of IP addresses during the authentication phase.
- **Dynamic Authorization**: Authorized countries can be updated instantly by Super Admins, allowing for travel or role changes.
- **Security Audit Logs**: Every login attempt (successful or blocked) is recorded with IP, detected country, and timestamp.
- **Strict Error Messaging**: Provides clear, firm feedback to unauthorized attempts as per security protocols.

## Analysis

### 1. Security Point of View
- **Prevents Credential Abuse**: Even if an admin account is compromised, the attacker cannot log in from a different country without Super Admin approval.
- **Immutable Auditing**: The Audit Log system ensures that all access attempts are traceable, providing a clear trail for security forensics.
- **IP Spoofing Protection**: By checking `x-forwarded-for` and direct socket addresses, the system correctly identifies the originating IP behind most proxies.

### 2. Usability Point of View
- **Intuitive UI**: Super Admins use simple dropdowns to manage permissions, with visual status indicators (Strict Mode vs. Open Access).
- **Self-Service Notification workflow**: Admins notify the Super Admin of their location, who then enables access with a single click.
- **Zero-Latency for Users**: Geolocation lookups are performed against a local binary database, ensuring no measurable impact on login speed.

### 3. Scalability Point of View
- **Global Support**: Support for all ISO 3166-1 country codes.
- **Resource Efficient**: `geoip-lite` is extremely lightweight and does not require external API calls, making it suitable for high-traffic environments.
- **Regional Flexibility**: Supports 'Any' location for trusted primary admins or global roles, while maintaining strictness for regional staff.

## Usage Instructions

1. **Setting Location**: Super Admin navitates to **Admins Location** tab.
2. **Authorization**: Select the admin's current country from the dropdown. 
3. **Verification**: The admin can now log in. Their attempt will appear in the **Access History** modal.
4. **Blocking**: If an admin moves to a new country without notification, they will see:
   > "Sorry! You’re In An Unauthorized Country. Please, Contact Your Administrator For Further Details. Thank You And Have A Nice Day!"

---
*CloudLiteracy Security Framework v1.0*
