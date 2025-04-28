# Backend Exchange

Backend for Crypto Exchange

## วิธีติดตั้งและเริ่มต้นใช้งาน

1.Clone โปรเจกต์
```
git clone https://github.com/Diwwy20/backend-exchange
```
2.สร้างไฟล์ .env (สร้างไฟล์ .env ไว้ที่ root ของโปรเจกต์ และเพิ่มตัวแปรดังนี้)
```
PORT=5000
NODE_ENV=development
CLIENT_URL="http://localhost:5173"

# ส่วนของ DATABASE_URL คุณสามารถกำหนด username password และ database ของคุณได้เอง
  Example: DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database>?schema=<schema>
DATABASE_URL="postgresql://postgres:121111@localhost:5432/db_binance?schema=public"

# สร้างค่า JWT_SECRET และ JWT_REFRESH_SECRET ได้ด้วยคำสั่ง:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

JWT_SECRET=ใส่ค่าที่สร้างขึ้น
JWT_REFRESH_SECRET=ใส่ค่าที่สร้างขึ้น
```
3.ติดตั้ง Dependencies
```
npm install
```
4.ตั้งค่าฐานข้อมูล (สร้างตารางในฐานข้อมูลด้วย Prisma Migrate)
```
npx prisma migrate dev --name "init"
```
5.Seed ข้อมูลเริ่มต้น
```
npm run seed
```
6.Run Project
```
npm run dev
```

## Tech Stack
```
Node.js
Express.js
Prisma ORM
PostgreSQL
```
