// India Only Configuration
const INDIA_CODE = { code: 'IN', name: 'India', dial_code: '+91', flag: '🇮🇳' };

const PhoneInput = ({ phoneNumber, onPhoneChange }) => {
    return (
        <div className="flex gap-2">
            {/* Static Country Indicator (India Only) */}
            <div className="relative w-[80px] flex-shrink-0">
                <div
                    className="
                        w-full h-[44px] flex items-center justify-center gap-1
                        bg-[#F8FBFF] text-slate-700 rounded-xl border border-[#CBDDF8]
                        text-sm font-bold select-none
                    "
                >
                    <span className="text-base">{INDIA_CODE.flag}</span>
                    <span className="text-slate-600">{INDIA_CODE.dial_code}</span>
                </div>
            </div>

            {/* Phone Input Field */}
            <div className="relative flex-grow">
                <input
                    name="phone"
                    type="tel"
                    placeholder="Mobile Number"
                    maxLength={10}
                    className="w-full h-[44px] bg-[#F8FBFF] text-slate-700 pl-4 pr-4 rounded-xl border border-[#CBDDF8] outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all placeholder-slate-400 text-sm font-medium"
                    value={phoneNumber}
                    onChange={onPhoneChange}
                    required
                />
            </div>
        </div>
    );
};

export default PhoneInput;
