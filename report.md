# Application Test Report

This report details the findings from testing the PromptCradle frontend application.

## Testing Environment

- URL: http://localhost:8080/
- Date: 4/4/2025

## Summary

The application loads the index page correctly, but several key interactive elements are non-functional. Prompt creation (both button and icon), search filter clearing (button and icon), authentication modal tab switching, sign-in validation, and the 404 page's 'Return to Home' link are all currently broken. Testing of the prompt detail page and logged-in features was not possible due to these issues.

## Detailed Findings

The following sections detail the specific working and non-working features observed during testing:

### Index Page (`/`)

- **Working:**
  - Index page loads correctly.
  - Search input field accepts text and updates the UI to show the filter.
- **Not Working:**

  - The 'Create New Prompt' button in the empty state does not trigger any action.
  - The '+' icon above the 'Create your first prompt' text also does not trigger any action.
  - The 'Clear Filters' button (shown after searching) does not clear the search filter.

  - The 'x' icon within the search bar does not clear the search input.

### Prompt Detail Page (`/prompt/:id`)

- **Working:**
- **Not Working:**

### Authentication

- **Working:**
- **Not Working:**
  - Clicking the 'Sign In' button in the modal without entering email/password does not show any validation errors or prevent submission.
  - Clicking the 'Sign Up' tab in the Account modal does not switch to the sign-up form.

### Not Found Page (`*`)

- **Working:**
  - Navigating to an invalid route correctly displays the 404 page.
- **Not Working:**
  - The 'Return to Home' link does not navigate back to the home page.

### General Observations/Issues

- **Working:**
- **Not Working:**
