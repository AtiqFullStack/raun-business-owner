# Global loader

`GlobalLoader` is mounted once in `AppContent`, above the navigation content.
It uses an absolute overlay: the current screen remains visible and mounted.
Touches are blocked while it is shown to prevent duplicate submissions.

## Axios

The overlay is opt-in; local `loading` state always works as before.

```tsx
const { fetchData } = useAxios();
await fetchData({ url: '/example', showLoader: true, loaderText: 'Saving...' });
```

Set defaults for a hook and override them per request:

```tsx
const { fetchData } = useAxios({ showLoader: true });
await fetchData({ url: '/example' });
await fetchData({ url: '/background-refresh', showLoader: false });
```

A service can accept and forward `LoaderOptions` to `useAxios`. The profile
editor does this with `useOwnerProfileService({ showLoader: true })`.
Every request releases its loader in `finally`, including failed requests.
Concurrent requests have separate tokens and keep the overlay visible until
all operations using it finish.

## Other asynchronous work

```tsx
const id = useLoader.getState().showLoader('Uploading...');
try {
  await uploadFile();
} finally {
  useLoader.getState().hideLoader(id);
}
```
