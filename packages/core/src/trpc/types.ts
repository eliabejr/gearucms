import type { AnyTRPCRouter, inferRouterInputs, inferRouterOutputs } from "@trpc/server"

export type GearuTRPCRouter = AnyTRPCRouter
export type GearuTRPCInputs<TRouter extends AnyTRPCRouter> = inferRouterInputs<TRouter>
export type GearuTRPCOutputs<TRouter extends AnyTRPCRouter> = inferRouterOutputs<TRouter>
