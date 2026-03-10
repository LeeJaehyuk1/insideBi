"use client";

/**
 * SQL 에디터 전용 레이아웃:
 * 부모 (dashboard) layout의 p-6 패딩을 제거하고
 * 전체 화면을 꽉 채우기 위해 -m-6 (네거티브 마진)을 적용합니다.
 */
export default function SqlEditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        // 부모 layout의 p-6를 상쇄하고 남은 viewport를 꽉 채움
        <div className="-m-6 h-[calc(100vh-3.5rem)]">
            {children}
        </div>
    );
}
