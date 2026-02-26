/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    basePath: process.env.NODE_ENV === "production" ? "/insideBi" : "",
    assetPrefix: process.env.NODE_ENV === "production" ? "/insideBi/" : "",
    images: {
        unoptimized: true,
    },
};
export default nextConfig;
