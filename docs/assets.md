# Материалы

Все изображения — стоковые иллюстрации, не проекты вымышленного бренда. Получены 06.11.2026; кадрирование и размер изменены через параметры Unsplash. Названия фактур описательные и не являются названиями сортов камня или обещанием наличия.

- `interior.jpg` — Jonathan Ikemura, 13.11.2023: https://unsplash.com/photos/a-kitchen-with-a-marble-counter-top-and-a-center-island-4LJMOpAHEIc
- `warm.jpg` — Colin Watts, 02.02.2026: https://unsplash.com/photos/a-close-up-of-beige-marble-with-intricate-brown-veining-VVzp03HUIGk
- `light.jpg` — Akbar Nemati, 10.09.2023: https://unsplash.com/photos/a-close-up-of-a-white-marble-surface-DeULPxR3Lxk
- `dark.jpg` — David Tovar, 10.10.2018: https://unsplash.com/photos/a-black-and-white-marble-texture-with-a-light-brown-center-_PDt8nNAC-Q

На страницах фото указана свободная Unsplash License: https://unsplash.com/license — разрешает использование и изменение, в том числе коммерческое; запрещает продавать изображения без существенного изменения и составлять конкурирующий сервис. Возможные права третьих лиц лицензией автоматически не покрываются. Перед публичным применением повторно оценить контекст и права изображённых объектов.

## Пересмотр 07.11.2026

Все четыре страницы источников и условия Unsplash повторно проверены: каждое изображение помечено Free to use under Unsplash License. Лицензия допускает использование на сайте и изменение изображений. Автоматическая замена для демонстрационного кейса не требуется: интерьер подписан как иллюстрация, фактуры обозначены иллюстративными. До публичного размещения отдельно проверить права третьих лиц на конкретный изображённый интерьер и отсутствие вводящего в заблуждение впечатления о связи объекта с брендом; если это не удастся подтвердить для выбранного контекста, заменить `interior.jpg`. Юридическая экспертиза не проводилась.


## Концептуальная галерея — 12.11.2026

Пять изображений созданы встроенным инструментом imagegen по просьбе владельца; это вымышленные визуализации, не реальные изделия, проекты, документы о наличии или технические чертежи. PNG-оригиналы сохранены в `assets/concepts/`, версии JPEG для сайта уменьшены до длинной стороны 1200 px и сохранены с качеством 78 через `sips`. В `dist/` — только JPEG.

- `table`: скульптурный мраморный стол с центральной опорой.
- `fireplace`: каменный каминный портал в спокойном интерьере.
- `basin`: каменная чаша и столешница ванной.
- `object`: небольшой скульптурный сосуд на постаменте.
- `column`: деталь рифлёной колонны в интерьере.

Общий текст запросов: «Photorealistic conceptual visualization for a fictional stone atelier website gallery: [предмет]. Cohesive architectural editorial photography, warm limestone and ivory palette with subtle stone veining, soft diffuse natural side light, restrained interior, tactile material, believable construction, no people, no text, no watermark, not an actual commissioned project. One clear subject.» Для стола использован тот же подход с формулировкой «sculptural marble dining table with solid pedestal». Генерация не подтверждает физическую реализуемость конкретных форм; применимость и конструкцию требуется рассмотреть отдельно.

## Редизайн — 12.11.2026

- `assets/materials/calacatta.jpg`, `crema.jpg`, `travertine.jpg` — вырезки 640 px из ИИ-кадров `concepts/table.png`, `basin.png`, `column.png`; `statuario.jpg`, `verde.jpg`, `breccia.jpg` — вырезки из `light.jpg`, `dark.jpg`, `warm.jpg` (Unsplash, условия выше). Вырезаны через canvas в локальном Chrome, без генерации.
- `assets/concepts/table-1536.jpg` — JPEG 1536 px из `concepts/table.png` для первого экрана.
- `assets/fonts/` — Cormorant Garamond 500/600 и IBM Plex Sans 400/500, латиница и кириллица, woff2 из npm `@fontsource/cormorant-garamond@5.3.0` и `@fontsource/ibm-plex-sans@5.3.0` (jsDelivr), лицензия SIL OFL 1.1 — тексты рядом. Скачаны с разрешения владельца 12.11.2026.
- `assets/fonts/ibm-plex-sans-arabic-arabic-{400,500,600}-normal.woff2` и `OFL-ibm-plex-sans-arabic.txt` — npm `@fontsource/ibm-plex-sans-arabic@5.3.0` (jsDelivr), SIL OFL 1.1, скачаны с разрешения владельца 12.11.2026.

## Кадры Runway — 12.11.2026

- `assets/incoming-2026-11/*.png` — 36 исходников Nano Banana 2.1 (Runway), 223 964 777 байт (213,6 MiB), сгенерированы владельцем по `docs/photo-brief-2026-11-12.md`. Это ИИ-визуализации, на сайте подписаны как концепты. Исходники хранятся локально и в Git не входят (`.gitignore`); для повтора обработки нужен отдельно сохранённый комплект.
- `assets/concepts/lobby.jpg`, `kitchen.jpg`, `fireplace-nero.jpg`, `vanity-verde.jpg`, `onyx.jpg`, `path-home.jpg`, `path-trade.jpg` — JPEG-версии выбранных кадров (L1, K7, M2, B2, O3, M6, L3; коды — `docs/photo-selection-2026-11-12/map.json`).
- `assets/stone/*.jpg` — образцы 640 px, вырезанные из тех же кадров: калакатта (K7), статуарио (L1), неро (M2), верде (B2), оникс и травертин (O3).
