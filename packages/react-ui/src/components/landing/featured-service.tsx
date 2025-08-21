import React from 'react';
import useIntersectionObserver from '@/hooks/use-intersection-observer';

export default function FeaturedService() {
  const [ref] = useIntersectionObserver({ threshold: 0.1 });

  return (
    <section ref={ref}>
      <h2>บริการทดสอบสายสัญญาณด้วยเครื่อง Fluke</h2>

      <ul>
        <li>ตรวจสอบความต่อเนื่อง (Wiremap)</li>
        <li>ทดสอบประสิทธิภาพ (Performance Test)</li>
        <li>ออกรายงานรับรอง (Certification Report)</li>
      </ul>

      <a href="#rates">ดูอัตราค่าบริการ</a>

      <div>
        <h3>อ่านผล รายงานการทดสอบของ Fluke Networks</h3>
        <p>ทำความเข้าใจความหมายของค่าต่างๆ ในรายงานผลการทดสอบ</p>
      </div>

      <div>
        <p>เฮดรูม (NEXT)</p>
        <p>ความยาว</p>
        <p>ขีดจำกัดการทดสอบ</p>
        <p>สรุป: ผ่าน</p>
      </div>
    </section>
  );
}
