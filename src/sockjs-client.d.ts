// https://github.com/sockjs/sockjs-client/issues/439

declare module 'sockjs-client/dist/sockjs' {
  export default (await import('sockjs-client')).default
}
