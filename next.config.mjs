/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            allowedOrigins: [
                "localhost:3000",
                // Add production domain from environment variable
                ...(process.env.NEXT_PUBLIC_APP_URL
                    ? [new URL(process.env.NEXT_PUBLIC_APP_URL).host]
                    : [])
            ],
        },
    },
};

export default nextConfig;
