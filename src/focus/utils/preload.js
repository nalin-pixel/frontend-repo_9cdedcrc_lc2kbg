// Asset preloader for images
export function preloadImages(urls = []) {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image()
          img.onload = () => resolve({ url, ok: true })
          img.onerror = () => resolve({ url, ok: false })
          img.src = url
        })
    )
  )
}
