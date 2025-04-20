"use client";

import { useEffect, useState } from "react";

import {
  Authenticator,
  useTheme,
  View,
  Heading,
  Image,
  Text,
  Button,
  ThemeProvider,
  Theme,
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";

import { Divide, Menu, X, Loader } from "react-feather";
import { PropsWithChildren } from "react";

import Loading from "@/components/Loading";
import outputs from "@/amplify_outputs.json";
import { usePathname } from "next/navigation";
import Link from "next/link";

Amplify.configure(outputs);

const components = {
  Header() {
    const { tokens } = useTheme();

    return (
      <View textAlign="center" padding={tokens.space.large}>
        <Link href="/" className="inline-flex">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center mr-2">
            <Loader className="text-white" />
          </div>
          <span className="text-white my-auto text-xl font-bold">Omneon</span>
        </Link>
      </View>
    );
  },
  Footer() {
    const { tokens } = useTheme();

    return (
      <View textAlign="center" padding={tokens.space.large}>
        <Text color={tokens.colors.white}>Secured by AWS Cognito</Text>
      </View>
    );
  },
};

export function Providers({ children }: any) {
  const [showLoader, setShowLoader] = useState(true);

  const { tokens } = useTheme();

  const theme: Theme = {
    name: "Auth Theme",
    tokens: {
      components: {
        authenticator: {
          router: {
            boxShadow: `0 0 16px ${tokens.colors.overlay["10"]}`,
            borderWidth: "0",
          },
        },
        tabs: {
          item: {
            backgroundColor: "#08111566",
            borderColor: "#08111566",
          },
        },
      },
    },
  };

  return (
    <ThemeProvider theme={theme}>
      <View className="min-h-screen relative ">
        <Authenticator components={components}>{children}</Authenticator>
      </View>
    </ThemeProvider>
  );
}
