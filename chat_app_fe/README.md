# Chat App Frontend

Ứng dụng chat real-time được xây dựng với React, TypeScript, TailwindCSS và Socket.IO.

## Tính năng

- ✅ Đăng nhập / Đăng ký
- ✅ Chat real-time với Socket.IO
- ✅ Danh sách cuộc trò chuyện
- ✅ Gửi và nhận tin nhắn
- ✅ Hiển thị typing indicator
- ✅ Đánh dấu tin nhắn đã đọc
- ✅ Responsive design với TailwindCSS

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

File `.env` đã được tạo sẵn với cấu hình mặc định:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### 3. Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: `http://localhost:5173`

## Cấu trúc thư mục

```
src/
├── components/         # React components
│   ├── Chat/           # Chat components
│   │   ├── ChatLayout.tsx
│   │   ├── ConversationList.tsx
│   │   ├── ConversationItem.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageItem.tsx
│   │   └── MessageInput.tsx
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   ├── AuthContext.tsx
│   └── ChatContext.tsx
├── pages/              # Page components
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── ChatPage.tsx
├── services/           # API services
│   ├── api.ts
│   ├── auth.service.ts
│   ├── chat.service.ts
│   └── socket.service.ts
├── types/              # TypeScript types
│   └── index.ts
├── config/             # Configuration
│   └── constants.ts
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## Công nghệ sử dụng

- **React 19** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **React Router** - Routing
- **Vite** - Build tool

## API Endpoints

### Authentication
- `POST /auth/login` - Đăng nhập
- `POST /auth/register` - Đăng ký
- `POST /auth/logout` - Đăng xuất
- `POST /auth/refresh-token` - Refresh token

### Chat
- `GET /chat/conversations` - Lấy danh sách cuộc trò chuyện
- `GET /chat/conversations/:id` - Lấy chi tiết cuộc trò chuyện
- `GET /chat/conversations/:conversationId/messages` - Lấy tin nhắn
- `POST /chat/conversations/:conversationId/messages` - Gửi tin nhắn
- `PUT /chat/messages/:messageId` - Chỉnh sửa tin nhắn
- `DELETE /chat/messages/:messageId` - Xóa tin nhắn
- `PUT /chat/conversations/:conversationId/read` - Đánh dấu đã đọc

## Socket Events

### Client to Server
- `chat:join_conversations` - Join tất cả conversations
- `chat:typing` - Gửi typing indicator
- `chat:stop_typing` - Dừng typing indicator

### Server to Client
- `user:online` - User đang online
- `user:offline` - User offline
- `chat:new_message` - Tin nhắn mới
- `chat:message_updated` - Tin nhắn được cập nhật
- `chat:message_deleted` - Tin nhắn bị xóa
- `chat:user_typing` - User đang nhập
- `chat:user_stop_typing` - User dừng nhập

## Build cho production

```bash
npm run build
```

## License

MIT

