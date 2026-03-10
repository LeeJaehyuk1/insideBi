/**
 * questions/pick 전용 레이아웃:
 * 모달 UI가 전체화면을 덮어야 하므로 부모 p-6 패딩 제거
 */
export default function PickLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="-m-6 h-[calc(100vh-3.5rem)] overflow-hidden">
            {children}
        </div>
    );
}
