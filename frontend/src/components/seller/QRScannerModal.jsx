import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { FaTimes } from 'react-icons/fa';

const QRScannerModal = ({ onClose, onScanSuccess }) => {
    const scannerRef = useRef(null);
    const [cameraReady, setCameraReady] = useState(false);

    useEffect(() => {
        // Core Scanner Instance
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const config = {
            fps: 20,
            aspectRatio: 1.0,
            disableFlip: false
        };

        // Start Scanner
        html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                // Success
                stopScanner().then(() => {
                    onScanSuccess(decodedText);
                });
            },
            (errorMessage) => {
                // frame error - normal
            }
        ).then(() => {
            setCameraReady(true);
        }).catch((err) => {
            console.error("Scanner Start Error:", err);
        });

        const stopScanner = async () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                try {
                    await scannerRef.current.stop();
                } catch (e) {
                    console.error("Stop Error:", e);
                }
            }
        };

        return () => {
            stopScanner();
        };
    }, []);

    return createPortal(
        <div className="fixed inset-0 bg-black z-[99999] flex flex-col items-center justify-center p-4">
            {/* Header */}
            <div className="absolute top-4 right-4 z-[100000]">
                <button onClick={onClose} className="bg-white/10 p-3 rounded-full text-white backdrop-blur hover:bg-white/20 transition-all">
                    <FaTimes size={24} />
                </button>
            </div>

            <style>
                {`
                    #reader video {
                        object-fit: cover !important;
                        border-radius: 2rem !important;
                    }
                    /* Force hide library-injected canvas layers */
                    #reader canvas {
                        display: none !important;
                    }
                    /* Remove any white borders or rectangles from the library */
                    #reader div {
                        border: none !important;
                        background: transparent !important;
                    }
                `}
            </style>

            <div className="text-center mb-8 animate-fade-in relative z-50">
                <h2 className="text-white text-3xl font-black mb-2 tracking-tight">Scan Customer QR</h2>
                <p className="text-white/60 text-sm font-medium">Align the QR code within the frame</p>
            </div>

            {/* Scanner Container with Overlay Decoration */}
            <div className="relative w-full max-w-[320px] aspect-square bg-[#111] rounded-[2.5rem] overflow-hidden border-4 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center">
                <div id="reader" className="w-full h-full"></div>

                {/* Visual Scanner Frame Overlay */}
                {!cameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Premium Animated Decoration Corners */}
                <div className="absolute inset-0 pointer-events-none p-8">
                    <div className="w-full h-full relative">
                        {/* Top Left */}
                        <div className="absolute top-0 left-0 w-10 h-10 border-t-[5px] border-l-[5px] border-indigo-500 rounded-tl-2xl shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                        {/* Top Right */}
                        <div className="absolute top-0 right-0 w-10 h-10 border-t-[5px] border-r-[5px] border-indigo-500 rounded-tr-2xl shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                        {/* Bottom Left */}
                        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[5px] border-l-[5px] border-indigo-500 rounded-bl-2xl shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                        {/* Bottom Right */}
                        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[5px] border-r-[5px] border-indigo-500 rounded-br-2xl shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>

                        {/* Scanning Line Animation */}
                        {cameraReady && (
                            <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent top-1/2 animate-scan-y shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">
                Aisle Verification Core
            </div>
        </div>,
        document.body
    );
};

export default QRScannerModal;
