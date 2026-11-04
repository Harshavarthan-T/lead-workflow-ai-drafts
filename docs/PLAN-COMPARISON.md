# Acceptance checks, 4 November 2026

| Check | Observed result |
|---|---|
| Hidden campaign fields | Production form rendered both hidden inputs with the query-string values. |
| Duplicate email | Initial submission, identical repeat and changed follow-up retained LEAD-16. Only the first and changed enquiry reached Gmail. |
| CRM and AI | Nine distinct valid fixture contacts reached pending_review. Results included spam, pricing, support and demo requests. |
| Empty message | Rejected before CRM or AI. |
| Gmail safety | Both Gmail operations are Create Draft. Changed enquiries can leave older drafts for manual review. |
| OpenAI failure | Isolated test execution 29 received a model-not-found error. Lead remained new. Execution 30 created the failure draft. The test workflow was unpublished afterward. |
| Weekly report | Drive download, CSV processing and output succeeded. Rerun retained two campaign rows, with 5% / €40 and 2% / no leads. |

The duplicate decision uses a lookup, a Code node and Sheets append-or-update. First capture date and campaign remain attached to the contact. Multiple historical matches require manual reconciliation. Sheets has no transactional uniqueness guarantee for simultaneous submissions. A crash after Gmail creates a draft but before Sheets records completion can leave an extra draft on retry. Review older drafts before sending manually.

The integration run used fictional leads and a normalized sample CSV. Scheduled wall-clock firing and real Ads Manager exports remain unobserved. Failure alerts appear in Drafts, so operators must check Drafts or n8n Executions.
