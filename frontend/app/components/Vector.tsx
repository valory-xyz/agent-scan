import type { NextPage } from 'next';
import Image from "next/image";
import TwitterLogo from '../assets/twitter-logo.svg';
import styles from './Vector.module.css';

const Vector: NextPage = () => {
    return (
        <Image className={styles.vectorIcon} src={TwitterLogo} width={14.4} height={13} sizes="100vw" alt="X (Twitter)" />);
};

export default Vector;
