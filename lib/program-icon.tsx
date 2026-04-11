"use client";

import type { IconProps } from "@phosphor-icons/react";
// Direct imports — bypasses the 192KB barrel file for guaranteed tree-shaking
import { House } from "@phosphor-icons/react/dist/csr/House";
import { HouseLine } from "@phosphor-icons/react/dist/csr/HouseLine";
import { CurrencyDollar } from "@phosphor-icons/react/dist/csr/CurrencyDollar";
import { Coins } from "@phosphor-icons/react/dist/csr/Coins";
import { HandCoins } from "@phosphor-icons/react/dist/csr/HandCoins";
import { Money } from "@phosphor-icons/react/dist/csr/Money";
import { Wallet } from "@phosphor-icons/react/dist/csr/Wallet";
import { Bank } from "@phosphor-icons/react/dist/csr/Bank";
import { HandHeart } from "@phosphor-icons/react/dist/csr/HandHeart";
import { Heart } from "@phosphor-icons/react/dist/csr/Heart";
import { Stethoscope } from "@phosphor-icons/react/dist/csr/Stethoscope";
import { Pill } from "@phosphor-icons/react/dist/csr/Pill";
import { FirstAid } from "@phosphor-icons/react/dist/csr/FirstAid";
import { Hospital } from "@phosphor-icons/react/dist/csr/Hospital";
import { Wheelchair } from "@phosphor-icons/react/dist/csr/Wheelchair";
import { Bed } from "@phosphor-icons/react/dist/csr/Bed";
import { BowlFood } from "@phosphor-icons/react/dist/csr/BowlFood";
import { Bread } from "@phosphor-icons/react/dist/csr/Bread";
import { Lightning } from "@phosphor-icons/react/dist/csr/Lightning";
import { Thermometer } from "@phosphor-icons/react/dist/csr/Thermometer";
import { Drop } from "@phosphor-icons/react/dist/csr/Drop";
import { ShieldCheck } from "@phosphor-icons/react/dist/csr/ShieldCheck";
import { Scales } from "@phosphor-icons/react/dist/csr/Scales";
import { Gavel } from "@phosphor-icons/react/dist/csr/Gavel";
import { GraduationCap } from "@phosphor-icons/react/dist/csr/GraduationCap";
import { Briefcase } from "@phosphor-icons/react/dist/csr/Briefcase";
import { Bus } from "@phosphor-icons/react/dist/csr/Bus";
import { Truck } from "@phosphor-icons/react/dist/csr/Truck";
import { Phone } from "@phosphor-icons/react/dist/csr/Phone";
import { Compass } from "@phosphor-icons/react/dist/csr/Compass";
import { Signpost } from "@phosphor-icons/react/dist/csr/Signpost";
import { Lightbulb } from "@phosphor-icons/react/dist/csr/Lightbulb";
import { Users } from "@phosphor-icons/react/dist/csr/Users";
import { UsersThree } from "@phosphor-icons/react/dist/csr/UsersThree";
import { MapPin } from "@phosphor-icons/react/dist/csr/MapPin";
import { Buildings } from "@phosphor-icons/react/dist/csr/Buildings";
import { Lifebuoy } from "@phosphor-icons/react/dist/csr/Lifebuoy";
import { Star } from "@phosphor-icons/react/dist/csr/Star";
import { Certificate } from "@phosphor-icons/react/dist/csr/Certificate";
import { Calendar } from "@phosphor-icons/react/dist/csr/Calendar";
import { Clock } from "@phosphor-icons/react/dist/csr/Clock";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { ListChecks } from "@phosphor-icons/react/dist/csr/ListChecks";
import { Leaf } from "@phosphor-icons/react/dist/csr/Leaf";
import { Gift } from "@phosphor-icons/react/dist/csr/Gift";
import { Megaphone } from "@phosphor-icons/react/dist/csr/Megaphone";
import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import type { ComponentType } from "react";

const ICON_MAP: Record<string, ComponentType<IconProps>> = {
  House, HouseLine, CurrencyDollar, Coins, HandCoins, Money, Wallet, Bank,
  HandHeart, Heart, Stethoscope, Pill, FirstAid, Hospital, Wheelchair, Bed,
  BowlFood, Bread, Lightning, Thermometer, Drop, ShieldCheck, Scales, Gavel,
  GraduationCap, Briefcase, Bus, Truck, Phone, Compass, Signpost, Lightbulb,
  Users, UsersThree, MapPin, Buildings, Lifebuoy, Star, Certificate, Calendar,
  Clock, FileText, ListChecks, Leaf, Gift, Megaphone, CheckCircle,
};

const TYPE_DEFAULTS: Record<string, string> = {
  benefit: "CurrencyDollar",
  resource: "Compass",
  navigator: "Signpost",
  employment: "Briefcase",
};

interface ProgramIconProps extends Omit<IconProps, "ref"> {
  iconName?: string | null;
  programType?: string;
}

export function ProgramIcon({ iconName, programType, ...props }: ProgramIconProps) {
  const name = iconName || TYPE_DEFAULTS[programType || "benefit"] || "FileText";
  const Icon = ICON_MAP[name] || ICON_MAP.FileText;
  return <Icon {...props} />;
}
