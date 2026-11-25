# Crypto Tracker

Крипто-трекер на React: показывает топ-100 криптовалют по капитализации, цену в долларах и изменение за 24 часа. Есть поиск по тикеру и названию, кнопка обновления данных и обработка состояний загрузки и ошибок.

## Участники

- Алимурадов Руслан Шафиевич — 24кнт-6
- Штыров Иван Дмитриевич — 24кнт-1

## API

Данные берутся из CoinGecko (без ключа):

https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1

Используются поля: `id`, `symbol`, `name`, `image`, `current_price`, `price_change_percentage_24h`.

Состояние загрузки хранится в объекте с полем `status`: `loading`, `error` или `ready`.

## Команды запуска и сборки

```bash
npm install
npm run dev
```

Сборка проекта:

```bash
npm run build
```

Проверка собранной версии локально:

```bash
npm run preview
```

## Сайт

https://runemo1337.github.io/web-hw-3/