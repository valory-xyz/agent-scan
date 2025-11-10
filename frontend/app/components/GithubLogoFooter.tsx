import type { NextPage } from 'next';
import Image from "next/image";
import GithubLogo from '../assets/github-logo.svg';
import styles from './Vector.module.css';

const Vector: NextPage = () => {
    return (
        <Image
            className={styles.vectorIcon}
            src={GithubLogo}
            width={14.4}
            height={13}
            sizes="100vw"
            alt="Github"
        />
    );
};

export default Vector;
