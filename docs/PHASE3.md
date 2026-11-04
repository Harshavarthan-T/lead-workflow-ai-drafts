# Weekly report

Export one complete Monday–Sunday week in EUR with one row per campaign. Rename headers and format numbers and ISO dates to match examples/AdData-demo.csv. Weekly reach must come from the platform's campaign total because people can overlap across days.

Drop the file in the configured Drive folder. The workflow selects the most recently modified CSV, downloads it, validates it, updates AdData by campaign/week and recalculates completed weeks from stored data. Import files in sequence. If several files arrive before one run, only the newest is selected. The optional upload form supports manual backfill.

Leads are counted by first capture date in Europe/Berlin and matching campaign. CTR is clicks divided by impressions, with blank for zero impressions. CPL is EUR spend divided by leads. Weekly displays “no leads” for zero contacts. Missing ad rows produce no report row. Sequential reruns update by report_key. Keep Docker running for the Monday schedule.
