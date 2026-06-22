import './globals.css';

export const metadata = {
  title: 'Secmind · AI 安全运营平台',
  description: 'Secmind AI security operations platform prototype',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.bunny.net" crossOrigin="anonymous" />
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700|jetbrains-mono:400,500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
