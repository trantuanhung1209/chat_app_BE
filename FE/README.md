# Frontend Structure

## 📁 Cấu trúc thư mục

```
FE/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # Main stylesheet
├── js/
│   ├── main.js         # App entry point
│   ├── config.js       # Configuration (API URL, constants)
│   ├── api.js          # API service layer
│   ├── auth.js         # Authentication logic
│   ├── friends.js      # Friends management
│   ├── chat.js         # Chat functionality
│   ├── search.js       # User search
│   ├── utils.js        # Utility functions
│   └── app.js          # Legacy file (deprecated)
└── assets/             # Images, icons, etc.
```

## 🔧 Module Dependencies

```
main.js (entry)
├── auth.js
│   ├── api.js
│   └── utils.js
├── friends.js
│   ├── api.js
│   └── utils.js
├── chat.js
│   └── utils.js
└── search.js
    └── utils.js
```

## 📝 File Descriptions

### `js/config.js`
Chứa các cấu hình và constants của app:
- API_URL
- Token refresh interval
- Toast duration

### `js/api.js`
Service layer cho tất cả API calls:
- Authentication APIs
- Friend management APIs
- Token management
- Request wrapper với auto-authorization

### `js/auth.js`
Xử lý logic authentication:
- Login/Register/Logout
- Google OAuth handling
- Token management
- User profile

### `js/friends.js`
Quản lý bạn bè:
- Display friends list
- Send/Accept/Reject friend requests
- Remove friends
- Filter friends

### `js/chat.js`
Chức năng chat (đang phát triển):
- Open/Close chat panel
- Send messages
- Load chat history

### `js/search.js`
Tìm kiếm người dùng (đang phát triển)

### `js/utils.js`
Các utility functions:
- Avatar generation
- Color generation
- Toast notifications
- Date formatting

### `js/main.js`
Entry point của app:
- Initialize app
- Setup event listeners
- Coordinate between modules

## 🚀 Sử dụng

Mở `index.html` trong browser hoặc serve qua backend tại `/FE/index.html`

## 🔄 Migration từ app.js cũ

File `js/app.js` cũ đã được tách thành nhiều modules nhỏ hơn:
- Code dễ maintain hơn
- Rõ ràng về responsibility của từng module
- Dễ dàng test và debug
- Support ES6 modules

File `app.js` cũ có thể xóa sau khi test kỹ.
