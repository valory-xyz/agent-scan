import React from "react";
import Image from "next/image";
import Logo from "./assets/logo.svg";
import RobotHandshake from "./assets/robot-handshake.svg";
import TransactionGraph from "./assets/x402-graph.png";
import GithubLogo from "./components/GithubLogoFooter";
import TwitterLogo from "./components/TwitterLogoFooter";

import OlasLogo from "./components/OlasLogo";

export default function ComingSoonPage() {
    return (
        <div
            className="bg-gradient-to-b from-[#151619] to-[#0a0a0a] min-h-screen h-screen flex flex-col items-center justify-between overflow-hidden"
            data-name="Coming Soon Page"
            data-node-id="20:6160"
        >
            {/* Header with Logo */}
            <div className="w-full flex justify-center pt-6 sm:pt-8 md:pt-10 lg:pt-12" data-node-id="20:6173">
                <div className="flex items-center gap-2 sm:gap-3 relative">
                    {/* Q Logo with decorative stars - using local SVG */}
                    <div className="relative w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9">
                        <Image alt="Q Logo" src={Logo} fill className="object-contain" />
                    </div>

                    {/* AgentScan Text */}
                    <div className="text-[35.13px] leading-[34px] font-['Iceland',sans-serif] text-white">
                        AgentScan
                    </div>
                </div>
            </div>

            {/* Central Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full py-4">
                {/* Fixed container for graph and handshake */}
                <div className="relative flex flex-col items-center">
                    {/* Robot Handshake Image - responsive sizing */}
                    <div className="relative w-[90vw] max-w-[600px] md:max-w-[700px] lg:max-w-[45rem] aspect-[2/1] mb-8 md:mb-12 lg:mb-16">
                        <div
                            className="relative w-full h-full opacity-70"
                            style={{
                                maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)'
                            }}
                        >
                            <Image
                                alt="Robot handshake"
                                src={RobotHandshake}
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>

                        {/* Olas Logo on purple hand */}
                        <div className="absolute left-[38%] top-[50%] w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14">
                            <OlasLogo />
                        </div>

                        {/* Transaction Graph positioned over the handshake */}
                        <div className="absolute -top-24 sm:-top-28 md:-top-32 lg:-top-36 left-1/2 -translate-x-1/2 w-[300px] h-[106px] sm:w-[400px] sm:h-[141px] md:w-[500px] md:h-[177px] lg:w-[582px] lg:h-[206px]">
                            <Image
                                alt=""
                                src={TransactionGraph}
                                fill
                                sizes="100vw"
                                className="object-cover opacity-50"
                            />
                        </div>
                    </div>

                    {/* CTA Button */}
                    <a
                        href="https://t.me/+_Lx91q1NH0VhZmZk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[rgba(204,213,255,0.1)] border border-[rgba(204,213,255,0.05)] px-5 py-2.5 sm:px-6 sm:py-3 md:px-7 md:py-3.5 rounded-2xl hover:bg-[rgba(204,213,255,0.15)] transition-colors cursor-pointer"
                    >
                        <p className="text-base sm:text-lg md:text-xl text-white font-normal whitespace-nowrap">
                            Launch With Us Now
                        </p>
                    </a>
                </div>
            </div>

            {/* Footer */}
            <div className="w-full flex items-center justify-center gap-2 pb-4 sm:pb-5 md:pb-6" data-name="Footer" data-node-id="20:6205">
                <p className="text-xs sm:text-sm md:text-base opacity-50 text-white text-center" data-node-id="20:6206">
                    © AgentScan 2025
                </p>
                <p className="text-base sm:text-lg opacity-50 text-white" data-node-id="20:6207">
                    •
                </p>
                <a
                    href="https://x.com/agentscan_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                    data-name="font-awesome-6-brands:x-twitter"
                    data-node-id="20:6210"
                >
                    <TwitterLogo />
                </a>
                <a

                    href="https://github.com/valory-xyz/agent-scan"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                    data-name="font-awesome-6-brands:github"
                    data-node-id="20:6210"
                >
                    <GithubLogo />
                </a>

            </div>
        </div>
    );
}
