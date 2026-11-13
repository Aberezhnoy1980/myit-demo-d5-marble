# D5 SLOY — бриф на 5 кадров для Runway

Дата: 12.11.2026. Цель: заменить бежевые кадры, похожие на известняк, на узнаваемый мрамор разных типов и добавить масштаб (кухня, лобби). Стол и колонну оставляем.

## 1. Какую модель выбрать

В Runway сейчас несколько моделей для изображений: свои (Gen-4 Image, Gen-4 Image Turbo) и сторонние (семейство Nano Banana от Google, Seedream, GPT Image и др.). Ниже — моя рекомендация для этой задачи.

| Роль | Модель | Почему | Цена (ориентир) |
|---|---|---|---|
| **Основная** | **Nano Banana 2** (или 2.1, если она есть в списке), разрешение **2K** | Сильный фотореализм материалов, точно следует длинному описанию, поддерживает референсы, 2K хватает для ретина-экранов | ~6 кредитов за кадр 2K |
| Запасная | **Gen-4 Image**, 1080p | Собственная модель Runway, хорошо держит стиль по референсу (до 3 картинок, ссылки через `@имя` в промпте) | 8 кредитов за кадр 1080p |
| Для черновиков | **Gen-4 Image Turbo** или Nano Banana 2 в 1K | Дёшево проверить композицию, прежде чем тратить кредиты на финал | 2–4 кредита |

Цены взяты со страниц Runway и могут отличаться от того, что показывает приложение. Перед генерацией смотрите стоимость на карточке модели. По моей оценке, весь бриф обойдётся примерно в 150–250 кредитов: черновики плюс по 4 финальных варианта на каждый из 5 кадров.

Если Nano Banana даёт «пластиковый» камень или слишком глянцевую рекламную картинку, сгенерируйте тот же промпт в Gen-4 Image и сравните.

## 2. Термины в одну строку

- **Промпт** — текстовое описание кадра для модели.
- **Соотношение сторон (aspect ratio)** — форма кадра: 4:3 — слегка вытянутый по горизонтали, 1:1 — квадрат.
- **Разрешение (1K / 2K / 1080p)** — размер картинки в пикселях; 2K ≈ 2048 px по длинной стороне.
- **Референс** — картинка-образец, которую модель учитывает по стилю, свету или объекту.
- **Вариант** — один из нескольких кадров, которые модель выдаёт на один промпт; лучший выбираете вы.
- **Seed** — номер случайности; с тем же seed и промптом модель повторяет похожий результат. Пригодится, если понравился кадр и хочется мелкой правки.

## 3. Параметры для всех кадров

| Параметр | Значение | Зачем |
|---|---|---|
| Соотношение сторон | **16:9** — кухня и лобби (пространства); **4:3** — камин, ванная, оникс (предметы) | Широкие кадры встанут в широкие карточки на всю ширину сетки, предметные — в обычные карточки; на телефоне из любого кадра вырезается 4:5 по центру |
| Разрешение | **2K** (Nano Banana) / **1080p** (Gen-4) | Достаточно для широких карточек и экранов с высокой плотностью |
| Число вариантов | 4 на промпт | Есть из чего выбрать |
| Референс | по желанию: `assets/concepts/table.png` | Держит общий свет и цвет серии; см. раздел 5 |
| Формат скачивания | PNG, полное разрешение | Сжатие и нарезку я сделаю сам |

**Композиция:** главный предмет — в центральных ~60% кадра, по краям воздух. Для 16:9 строже: главное — в **центральной трети** по ширине. На телефоне из широкого кадра остаётся меньше половины ширины, и края уйдут.

Каждый кадр генерируется **в одном формате** — в том, что указан у него в разделе 4. Дублировать в двух форматах не нужно.

## 4. Промпты

Каждый промпт состоит из **общего блока стиля** и **описания кадра**. Копируйте целиком: сначала описание кадра, затем блок стиля. Промпты на английском — модели лучше понимают английский.

### Общий блок стиля (добавлять в конец каждого промпта)

```
Photorealistic architectural interior photograph for a high-end natural stone atelier in Dubai. The stone is the hero of the image: true-to-life marble with natural, irregular veining, realistic polished or honed reflections and crisp, precise edges. Warm late-afternoon sunlight through a large window, clear directional shadows, soft bounce light. Calm warm-neutral palette: off-white plaster walls, pale stone floor, light oak and brushed brass accents. Minimal styling, no clutter. Full-frame camera, 35 mm lens, eye level, straight vertical lines, f/8, everything in focus, natural colours, subtle film grain. No people, no text, no logos, no watermark.
```

### Кадр 1 — Кухонный остров · тип калакатта
Файл: `kitchen-calacatta.png` · формат **16:9**

```
A large kitchen island in a contemporary villa kitchen. The island has a thick mitred top and waterfall sides in white marble with bold gold and soft grey veining (Calacatta type); the veins flow continuously over the edge and down the sides. Behind it, flat-front cabinetry in light oak and a brushed brass tap. Two linen bar stools, a single ceramic bowl. The island sits in the central third of a wide frame, seen from a slight three-quarter angle, with the kitchen extending to both sides.
```

### Кадр 2 — Каминный портал · чёрный мрамор (тип неро)
Файл: `fireplace-nero.png` · формат **4:3**

```
A contemporary fireplace surround in a villa living room: a simple rectangular frame with a deep mantel shelf in honed black marble with fine white veining (Nero Marquina type), set into a warm off-white plaster wall. A low linen sofa partly visible at the left edge, one ceramic vase on the mantel. The fireplace is centred, seen almost straight on, slightly off-axis.
```

### Кадр 3 — Ванная · зелёный мрамор (тип верде)
Файл: `vanity-verde.png` · формат **4:3**

```
A hotel suite bathroom with a floating vanity and an integrated basin carved from deep green marble with white veining (Verde type). The wall behind is clad in the same marble, with book-matched slabs creating a mirrored vein pattern. Brushed brass wall-mounted tap, a round mirror, a folded white towel. Vanity centred in the frame, seen straight on from slightly above counter height.
```

### Кадр 4 — Лобби жилой башни · белый мрамор (тип статуарио)
Файл: `lobby-statuario.png` · формат **16:9**

```
The double-height lobby of a residential tower in Dubai. The floor and a large feature wall are in white marble with soft grey veining (Statuario type); the wall uses large book-matched slabs that form a symmetrical mirrored vein pattern. A low reception desk in the same marble. Wide view that shows the scale of the space and the precise joints between slabs. Empty, calm, early evening warm light.
```

### Кадр 5 — Объект из оникса с подсветкой
Файл: `object-onyx.png` · формат **4:3**

```
A sculptural block of honey onyx glowing softly from within, its translucent amber and cream bands clearly visible, standing on a travertine plinth in a quiet gallery-like room with warm plaster walls. Low evening light, the onyx is the brightest element in the frame. Object centred with generous space around it.
```

## 5. Как работать в Runway (пошагово)

Названия кнопок в интерфейсе могут немного отличаться.

1. Откройте раздел генерации изображений (Image / Generate image).
2. В списке моделей выберите **Nano Banana 2** (2.1, если есть).
3. Поставьте соотношение сторон из раздела 4 (16:9 или 4:3), разрешение — **1K** для черновика.
4. Вставьте промпт кадра 1 вместе с блоком стиля и сгенерируйте 2–4 варианта.
5. Если композиция в целом устраивает, повторите тот же промпт в **2K** с 4 вариантами.
6. **Референс (по желанию).** Прикрепите `assets/concepts/table.png` и допишите в начало промпта: `Match the lighting, colour grading and photographic style of the reference image, but do not copy its objects or layout.` Если модель начинает копировать стол, уберите референс.
7. Выберите лучший вариант по чек-листу ниже и скачайте PNG в полном размере.
8. Повторите для кадров 2–5.

## 6. Чек-лист выбора кадра

- Камень узнаётся: белый с золотом, чёрный с белыми прожилками, зелёный, белый с серым, светящийся оникс.
- Прожилки естественные и непрерывные: на стыках и кромках рисунок продолжается, без «обоев» и повторов.
- Прямые линии прямые: вертикали стен, кромки, швы плит.
- Нет мусора генерации: кривой сантехники, лишних ножек, расплавленных предметов, надписей, логотипов.
- Свет тёплый и мягкий, кадр по настроению стыкуется с текущим столом.
- Главный предмет в центре, по краям есть воздух.

## 7. Куда положить

Сохраните 5 файлов с именами из раздела 4 в новую папку:

```
/Users/alex/myit/demo/Landing/d5-marble/assets/incoming-2026-11/
```

Или просто приложите их в чат. Дальше я сам: сожму, сделаю версии для сайта, обновлю коллекцию (7 предметов вместо 5), подписи камня и обработки на EN/RU/AR, задачи в форме, проверки и снимки.

## 8. Необязательно: вторая партия — образцы камня

Если первая партия понравится, той же моделью можно сделать плоские образцы для библиотеки взамен вырезок: 1:1, 2K, по одному на тип. Шаблон:

```
Top-down studio photograph of a single polished slab sample of [STONE], filling the whole frame edge to edge, even soft daylight, no shadows, no objects, true-to-life colour and texture. No text, no logos.
```

`[STONE]` заменить на: `white marble with bold gold veining (Calacatta type)`, `white marble with soft grey veining (Statuario type)`, `black marble with fine white veining (Nero Marquina type)`, `deep green marble with white veining (Verde type)`, `beige marble with quiet veining (Crema type)`, `filled and honed ivory travertine`, `honey onyx with translucent amber bands`.

## Источники

- [Runway Academy — Credits & Available Models](https://academy.runwayml.com/models-pricing)
- [Runway Help — Creating with Gen-4 Image](https://help.runwayml.com/hc/en-us/articles/37053594806419-Creating-with-Gen-4-Image)
- [Runway API — Available models](https://docs.dev.runwayml.com/guides/models/)
- [Runway API — Pricing](https://docs.dev.runwayml.com/guides/pricing/)
- [Runway Changelog](https://runway.com/changelog)
