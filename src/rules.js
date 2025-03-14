export const rules = {
  version: 1,
  provider: "TGT",
  metadata: {
    provider: "TGT",
    providerData: {
      identityTemplate: "template.<key>.<identity>",
      buckets: 2,
    },
  },
  rules: [
    {
      key: "activity2",
      condition: {
        type: "group",
        definition: {
          logic: "and",
          conditions: [
            {
              type: "matcher",
              definition: {
                key: "allocation",
                matcher: "lt",
                values: [50],
              },
            },
          ],
        },
      },
      consequences: [
        {
          id: "consequence-3",
          type: "proposition",
          detail: {
            id: "proposition-1",
            scope: "__view__",
            scopeDetails: {},
            items: [
              {
                id: "0",
                schema:
                  "https://ns.adobe.com/personalization/json-content-item",
                meta: {},
                data: {
                  id: "0",
                  format: "application/json",
                  content: {},
                },
              },
            ],
          },
        },
      ],
    },
    {
      key: "activity2",
      condition: {
        type: "group",
        definition: {
          logic: "and",
          conditions: [
            {
              type: "matcher",
              definition: {
                key: "allocation",
                matcher: "ge",
                values: [50],
              },
            },
          ],
        },
      },
      consequences: [
        {
          id: "consequence-4",
          type: "proposition",
          detail: {
            id: "proposition-1",
            scope: "__view__",
            scopeDetails: {},
            items: [
              {
                id: "0",
                schema:
                  "https://ns.adobe.com/personalization/json-content-item",
                meta: {},
                data: {
                  id: "0",
                  format: "application/json",
                  content: {
                    payload: [
                      {
                        selector:
                          "#experience-the-magic-unforgettable-carousel-rides-for-the-whole-family",
                        payload:
                          "<h1 id='experience-the-magic-unforgettable-carousel-rides-for-the-whole-family'>Experience the Magic: Unforgettable Carousel Rides for the Whole Family!(B)</h1>",
                      },
                      {
                        selector: "main > div > p > picture",
                        payload:
                          "<picture style='min-height:421px'><source srcset='https://luma.enablementadobe.com/content/luma/us/en/men/_jcr_content/root/hero_image.coreimg.jpeg' /><img src='https://luma.enablementadobe.com/content/luma/us/en/men/_jcr_content/root/hero_image.coreimg.jpeg'/></picture>",
                        browser: {
                          selector: ".hero picture",
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      ],
    },
  ],
};
