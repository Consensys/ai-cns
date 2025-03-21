import { useQuery } from "@tanstack/react-query";
//import info from "@/lib/info.json";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { apiClient } from "@/lib/api";
import { NavLink, useLocation } from "react-router";
import type { UUID } from "@elizaos/core";
import {
    Cog,
    HandCoins,
    SquareActivity,
    ThumbsUp,
    User,
    UserRoundPlus,
} from "lucide-react";
import ConnectionStatus from "./connection-status";

export function AppSidebar() {
    const location = useLocation();
    const query = useQuery({
        queryKey: ["agents"],
        queryFn: () => apiClient.getAgents(),
        refetchInterval: 5_000,
    });

    const agents = query?.data?.agents;

    return (
        <Sidebar>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <NavLink to="/">
                                <img
                                    alt="csn-icon"
                                    src="/csn-icon-transparent.png"
                                    width="100%"
                                    height="100%"
                                    className="size-10"
                                />

                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold uppercase text-xl">
                                        CNS
                                    </span>
                                    <span className="text-xs text-blue-400">
                                        consensys network state
                                    </span>
                                </div>
                            </NavLink>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        <ConnectionStatus />
                    </SidebarMenu>
                    <SidebarGroupLabel>AI Netizens</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {query?.isPending ? (
                                <div>
                                    {Array.from({ length: 5 }).map(
                                        (_, _index) => (
                                            <SidebarMenuItem
                                                key={"skeleton-item"}
                                            ></SidebarMenuItem>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {agents?.map(
                                        (agent: { id: UUID; name: string }) => (
                                            <SidebarMenuItem key={agent.id}>
                                                <NavLink
                                                    to={`/chat/${agent.id}`}
                                                >
                                                    <SidebarMenuButton
                                                        isActive={location.pathname.includes(
                                                            agent.id
                                                        )}
                                                    >
                                                        <User />
                                                        <span>
                                                            {agent.name}
                                                        </span>
                                                    </SidebarMenuButton>
                                                </NavLink>
                                            </SidebarMenuItem>
                                        )
                                    )}
                                </div>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarGroupLabel>Human Netizens</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <NavLink to="/netizens/0x44dc4e3309b80ef7abf41c7d0a68f0337a88f044">
                                    <SidebarMenuButton>
                                        <User />
                                        <span>dayan.linea.eth</span>
                                    </SidebarMenuButton>
                                </NavLink>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <NavLink to="/netizens/0x65a4CeC9f1c6060f3b987d9332Bedf26e8E86D17">
                                    <SidebarMenuButton>
                                        <User />
                                        <span>satya.linea.eth</span>
                                    </SidebarMenuButton>
                                </NavLink>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <NavLink to="/netizens/0x17757544f255c78D3492bc2534DBfaDD7C1bD007">
                                    <SidebarMenuButton>
                                        <User />
                                        <span>fred.linea.eth</span>
                                    </SidebarMenuButton>
                                </NavLink>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <NavLink to="/netizens/0x2754265A82705CEe4Fca6343a5cdD36850348780">
                                    <SidebarMenuButton>
                                        <User />
                                        <span>jb.linea.eth</span>
                                    </SidebarMenuButton>
                                </NavLink>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarGroupLabel>Services</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <NavLink to="/naturalization">
                            <SidebarMenuButton>
                                <UserRoundPlus /> Naturalization
                            </SidebarMenuButton>
                        </NavLink>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <NavLink to="/census">
                            <SidebarMenuButton>
                                <SquareActivity /> Census
                            </SidebarMenuButton>
                        </NavLink>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <NavLink to="/governance">
                            <SidebarMenuButton>
                                <ThumbsUp /> Governance
                            </SidebarMenuButton>
                        </NavLink>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <NavLink to="/allocation">
                            <SidebarMenuButton>
                                <HandCoins /> Resource Allocation
                            </SidebarMenuButton>
                        </NavLink>
                    </SidebarMenuItem>
                    <span className="py-4" />
                    <SidebarMenuItem>
                        <NavLink
                                to="/core"
                        >
                            <SidebarMenuButton disabled>
                                <Cog /> Resources
                            </SidebarMenuButton>
                        </NavLink>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
