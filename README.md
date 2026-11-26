# MoCourse Frontend

Angular app for the MoCourse platform (Arabic, right to left).
Built so far: login and register.

## Run it

```bash
npm install
npm start          # http://localhost:4200
```

The backend must run on `http://localhost:3000` (change it in `src/app/core/config.ts`).

## How it is organized

```
src/app/
  core/        auth.service.ts      login, register, logout, saves the token
               auth.interceptor.ts  adds the token to every backend request
               auth.guard.ts        blocks pages for logged-out users
               error-message.ts     backend error -> Arabic message
               config.ts            backend address
  auth/        auth-shell/          the shared frame (picture + form side)
               login/  register/    the two pages
  home/        the page after login (placeholder)
  app.routes.ts   which URL opens which page
```

Colors and shared form styles are in `src/styles.css`.
