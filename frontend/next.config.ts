import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Handle external modules that cause issues in browser
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    
    // Fix for viem and wagmi compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    }
    
    // Fix for React Native modules in web environment
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    }
    
    // Handle module resolution issues
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    })
    
    // Fix for Webpack module resolution
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
    }
    
    // Ignore problematic modules
    config.ignoreWarnings = [
      /Module not found: Can't resolve '@react-native-async-storage\/async-storage'/,
    ]
    
    return config
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@reown/appkit', '@reown/appkit-adapter-wagmi'],
};

export default nextConfig;