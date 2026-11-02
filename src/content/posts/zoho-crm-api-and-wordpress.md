---
title: "Zoho CRM API and WordPress"
date: 2014-07-09
summary: "Sending Gravity Forms leads to Zoho CRM."
tags:
  - "WordPress"
  - "CRM"
  - "Integrations"
legacyPath: /2014/07/09/zoho-crm-api-and-wordpress/
condensed: true
---

Hook `gform_after_submission`, map the form field IDs to lead fields, split the full name, wrap it in Zoho's XML lead payload, and POST it with cURL to the `insertRecords` endpoint. Early lead-routing work, long before Salesforce routing became a day job.
