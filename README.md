# WESPACE Back-end

## Getting Started

```shell
npm install uuid4
npm install ws
npm install websocket-json-stream
npm install sharedb
npm install rich-text

npm install socket.io-client
npm install socket.io
npm install cors
sharedb-mongo

# + June 5, 2019
npm i date-utils
```

### Redis

for *Windows*

명령 프롬포트(*cmd*) 창을 열고 다음과 같이 표시되면 정상적으로 완료되었습니다.

```shell
127.0.0.1:6379> keys *
(empty list or set)
127.0.0.1:6379>
```

만약 *wespace-server* 실행 시 *Error: Cannot find module 'redis'* 메시지가 나온다면 다음 명령어를 실행합니다.

```shell
npm install
npm start
# if you wanna run automatically
npm run start:dev
```

